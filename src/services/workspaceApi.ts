import { getAccessToken } from "./firebaseAuth";
import { ManhattanAuditData, CleraDiaryEntry, Habit, ManhattanDailyReport } from "../types";

export const MANHATTAN_SPREADSHEET_ID = "1KjoOGr4St39gbVGMUP_9x9B9xNQfAHCLNR4QSDq8_1s";

/**
 * Service for communicating with Google Workspace APIs (Sheets, Calendar, Gmail, Docs)
 * Using the client-side bearer access token.
 */

// 1. Google Sheets API - Read existing Manhattan Daily Reports
export async function pullManhattanDailyReports(
  spreadsheetId: string = MANHATTAN_SPREADSHEET_ID
): Promise<ManhattanDailyReport[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Authentication token is missing. Please sign in with Google.");
  }

  // Read range 'Daily Reports'!A4:W
  // Row 4 is the header row. Remaining rows are report entries.
  const range = encodeURIComponent("'Daily Reports'!A4:W");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=FORMATTED_VALUE`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.error?.message || `Google Sheets API error (${res.status} ${res.statusText})`;
    throw new Error(message);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  if (rows.length === 0) {
    return [];
  }

  // Row 4 of the sheet is the first element of rows (index 0)
  const headerRow: string[] = rows[0].map((h: any) => String(h || "").trim());
  const dataRows = rows.slice(1);

  // Helper to normalize header string for flexible mapping
  const normalize = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Create column index lookup
  const headerMap: { [key: string]: number } = {};
  headerRow.forEach((header, idx) => {
    headerMap[normalize(header)] = idx;
  });

  // Find column index matching any candidates
  const findColIdx = (candidates: string[]): number => {
    for (const cand of candidates) {
      const normCand = normalize(cand);
      if (headerMap[normCand] !== undefined) {
        return headerMap[normCand];
      }
      // Partial match
      for (const key of Object.keys(headerMap)) {
        if (key.includes(normCand) || normCand.includes(key)) {
          return headerMap[key];
        }
      }
    }
    return -1;
  };

  const dateIdx = findColIdx(["Date", "Timestamp", "Audit Date"]);
  const sprintIdx = findColIdx(["Sprint", "Sprint ID", "Milestone"]);
  const statusIdx = findColIdx(["Status", "State", "Report Status"]);
  const plannedDeliverableIdx = findColIdx(["Planned Deliverable", "Deliverable", "Planned"]);
  const whatILearnedIdx = findColIdx(["What I Learned", "Learnings", "What Learned"]);
  const practicalWorkBuiltIdx = findColIdx([
    "Practical Work Built",
    "Work Built",
    "Practical Work",
    "Output Shipped",
    "Built",
  ]);
  const evidenceLinksIdx = findColIdx(["Evidence / Links", "Evidence Links", "Evidence", "Links", "Artifacts"]);
  const gitCommitsIdx = findColIdx(["Git Commits", "Commits", "Git"]);
  const testsChecksIdx = findColIdx(["Tests / Checks", "Tests Checks", "Tests", "Checks", "Verification"]);
  const blockersIdx = findColIdx(["Blockers", "Obstacles", "Issues"]);
  const nextFirstActionIdx = findColIdx([
    "Next First Action",
    "Tomorrow First Action",
    "Next Action",
    "First Action",
  ]);
  const totalScoreIdx = findColIdx(["Total /100", "Total / 100", "Total", "Score", "Audit Score"]);
  const managerAssessmentIdx = findColIdx([
    "Manager Assessment",
    "Manager Review",
    "Assessment",
    "Reviewer Assessment",
  ]);
  const completenessIdx = findColIdx(["Completeness", "Completion %", "Completion"]);

  const reports: ManhattanDailyReport[] = [];

  for (const row of dataRows) {
    // Skip completely empty rows
    if (!row || row.every((cell) => cell === undefined || cell === null || String(cell).trim() === "")) {
      continue;
    }

    const getVal = (idx: number, fallback: string = "") => {
      if (idx >= 0 && row[idx] !== undefined && row[idx] !== null) {
        return String(row[idx]).trim();
      }
      return fallback;
    };

    // Parse score into a clean number
    const rawScore = getVal(totalScoreIdx);
    const scoreNum = parseFloat(rawScore.replace(/[^0-9.]/g, "")) || 0;

    // Build raw key-value dictionary using exact original headers
    const rawObj: Record<string, string> = {};
    headerRow.forEach((hdr, idx) => {
      if (hdr) {
        rawObj[hdr] = row[idx] !== undefined ? String(row[idx]) : "";
      }
    });

    const report: ManhattanDailyReport = {
      date: getVal(dateIdx),
      sprint: getVal(sprintIdx),
      status: getVal(statusIdx),
      plannedDeliverable: getVal(plannedDeliverableIdx),
      whatILearned: getVal(whatILearnedIdx),
      practicalWorkBuilt: getVal(practicalWorkBuiltIdx),
      evidenceLinks: getVal(evidenceLinksIdx),
      gitCommits: getVal(gitCommitsIdx),
      testsChecks: getVal(testsChecksIdx),
      blockers: getVal(blockersIdx),
      nextFirstAction: getVal(nextFirstActionIdx),
      totalScore: scoreNum,
      managerAssessment: getVal(managerAssessmentIdx),
      completeness: getVal(completenessIdx),
      raw: rawObj,
    };

    reports.push(report);
  }

  // Preserve newest-first order
  // Check if spreadsheet rows are oldest-first or newest-first.
  // Standard spreadsheet logs add newest at the bottom or top.
  // If dates are ISO or parseable, sort newest first; or if dates can be compared:
  reports.sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (!isNaN(timeA) && !isNaN(timeB)) {
      return timeB - timeA; // newest first
    }
    return 0; // retain natural order if date is not standard
  });

  return reports;
}

// 1. Google Sheets API - Write new spreadsheet (Preserved)
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
