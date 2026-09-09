import { getAccessToken } from "./firebaseAuth";
import { ManhattanAuditData, CleraDiaryEntry, Habit } from "../types";

/**
 * Service for communicating with Google Workspace APIs (Sheets, Calendar, Gmail, Docs)
 * Using the client-side bearer access token.
 */

// 1. Google Sheets API
export async function syncToGoogleSheets(
  auditData: ManhattanAuditData,
  habits: Habit[]
): Promise<{ spreadsheetId: string; url: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error("Authentication token is missing. Please sign in with Google.");

  // Create a new spreadsheet for Manhattan Project tracking
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title: `Manhattan Project Productivity Audit - ${new Date().toISOString().slice(0, 10)}`,
      },
      sheets: [
        {
          properties: { title: "Daily Audits" },
        },
        {
          properties: { title: "Active Habits" },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || "Failed to create Google Sheet");
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // Prepare audit rows
  const auditRows = [
    ["Date", "Score", "Verdict", "Execution Ratio", "Commits", "Notes"],
    ...auditData.history.map((h) => [
      h.date,
      h.score,
      h.verdict,
      h.executionRatio || "N/A",
      h.commitsCount || 0,
      h.notes || "",
    ]),
  ];

  // Populate Daily Audits sheet
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Daily%20Audits!A1:F${auditRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: auditRows }),
    }
  );

  // Prepare Habit rows
  const habitRows = [
    ["Habit Name", "Category", "Streak", "Best Streak", "Target", "Unit"],
    ...habits.map((h) => [
      h.title,
      h.category,
      h.currentStreak,
      h.bestStreak,
      h.targetCount,
      h.unit || "times",
    ]),
  ];

  // Populate Active Habits sheet
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Active%20Habits!A1:F${habitRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: habitRows }),
    }
  );

  return {
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}

// 2. Google Calendar API
export async function scheduleCalendarEvent(eventDetails: {
  summary: string;
  description: string;
  startTime: string; // ISO String
  durationMinutes: number;
}): Promise<{ eventId: string; htmlLink: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error("Authentication token is missing. Please sign in with Google.");

  const start = new Date(eventDetails.startTime);
  const end = new Date(start.getTime() + eventDetails.durationMinutes * 60000);

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: eventDetails.summary,
        description: eventDetails.description,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 10 }],
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to schedule Calendar event");
  }

  const data = await res.json();
  return { eventId: data.id, htmlLink: data.htmlLink };
}

// 3. Gmail API
export async function sendDailyDigestEmail(
  toEmail: string,
  auditData: ManhattanAuditData,
  diary: CleraDiaryEntry
): Promise<{ messageId: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error("Authentication token is missing. Please sign in with Google.");

  const subject = `Manhattan Project Daily Audit: Score ${auditData.currentScore}/100 (${auditData.verdict})`;
  const bodyText = `MANHATTAN PROJECT — DAILY EXECUTIVE REPORT
Date: ${auditData.latestAuditDate} (${auditData.timeZone})
Audit Score: ${auditData.currentScore}/100 [${auditData.rating}]
Daily Execution: ${auditData.dailyExecution} | Weekly Acceptance: ${auditData.weeklyAcceptance}

EXECUTIVE SUMMARY:
${diary.executiveSummary}

BIGGEST WIN:
${diary.biggestWin}

BIGGEST EXECUTION LEAK:
${diary.biggestExecutionLeak}

TOMORROW'S FIRST ACTION (UNDER 10 MINS):
${diary.tomorrowsFirstAction}

CLERA SECRETARY NOTE:
${diary.cleraSecretaryNote}

-- Sent automatically via Manhattan Habit & Activity Tracker`;

  // Encode RFC 2822 email message in base64url
  const emailContent = [
    `To: ${toEmail}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    "",
    btoa(unescape(encodeURIComponent(bodyText))),
  ].join("\r\n");

  const base64UrlMessage = emailContent
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: base64UrlMessage }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to send email via Gmail");
  }

  const data = await res.json();
  return { messageId: data.id };
}

// 4. Google Docs API
export async function exportDiaryToGoogleDoc(
  diary: CleraDiaryEntry,
  auditData: ManhattanAuditData
): Promise<{ documentId: string; url: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error("Authentication token is missing. Please sign in with Google.");

  // Step 1: Create empty document
  const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `CLERA Executive Diary - ${diary.date}`,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || "Failed to create Google Doc");
  }

  const doc = await createRes.json();
  const documentId = doc.documentId;

  // Step 2: Insert text into document
  const content = `CLERA — DAILY EXECUTIVE DIARY
Strict Evidence-Based Reporting · Date: ${diary.date}
Score: ${diary.dayScore}/100 | Verdict: ${diary.verdict} | Execution Rate: ${diary.executionRate}%

1. EXECUTIVE SUMMARY
${diary.executiveSummary}

2. BIGGEST WIN
${diary.biggestWin}

3. BIGGEST EXECUTION LEAK
${diary.biggestExecutionLeak}

4. KEY LESSON / REVIEW
${diary.keyLessonReview}

5. TOMORROW'S FIRST ACTION (Under 10 Minutes)
${diary.tomorrowsFirstAction}

6. OPEN QUESTIONS / BLOCKERS
${diary.openQuestionsBlockers}

7. CLERA'S SECRETARY NOTE
${diary.cleraSecretaryNote}

---------------------------------------------------
Operational KPIs:
- Average Score: ${auditData.averageScore}
- Days Logged: ${auditData.daysLogged}
- Commits Recorded: ${auditData.commitsRecorded}
- Weekly Target: ${auditData.weeklyAcceptance}
`;

  await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: content,
          },
        },
      ],
    }),
  });

  return {
    documentId,
    url: `https://docs.google.com/document/d/${documentId}`,
  };
}
