import { NotionDiarySyncEntry, NotionSyncResponse } from "../src/types";

export const NOTION_API_VERSION = "2022-06-28";

/**
 * Normalizes a Notion database ID or URL into a clean UUID string.
 * Handles 32-character raw hex strings, hyphenated UUIDs, and full Notion URLs.
 */
export function normalizeNotionDatabaseId(input: string): string {
  if (!input) return "";
  const cleaned = input.trim();

  // If a full Notion URL was pasted: extract the 32-character hex ID before any query parameters
  const match = cleaned.match(/([a-f0-9]{32})/i);
  if (match) {
    const raw = match[1].toLowerCase();
    return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
  }

  // If already hyphenated UUID
  const uuidMatch = cleaned.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (uuidMatch) {
    return uuidMatch[1].toLowerCase();
  }

  return cleaned;
}

/**
 * Validates that Notion credentials and destination are configured in server environment.
 * Rejects client-supplied credentials or destination overrides.
 */
export function getValidatedServerConfig(clientBody: any): { apiKey: string; databaseId: string } {
  if (clientBody && (clientBody.apiKey !== undefined || clientBody.databaseId !== undefined)) {
    const err: any = new Error(
      "Client-supplied Notion credentials or destination overrides are forbidden. Configure NOTION_API_KEY and NOTION_DATABASE_ID in server environment variables."
    );
    err.status = 400;
    throw err;
  }

  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    const err: any = new Error(
      "Server configuration error: NOTION_API_KEY environment variable is not configured."
    );
    err.status = 500;
    throw err;
  }

  const rawDbId = process.env.NOTION_DATABASE_ID;
  if (!rawDbId || rawDbId.trim() === "") {
    const err: any = new Error(
      "Server configuration error: NOTION_DATABASE_ID environment variable is not configured."
    );
    err.status = 500;
    throw err;
  }

  const databaseId = normalizeNotionDatabaseId(rawDbId);
  return { apiKey: apiKey.trim(), databaseId };
}

/**
 * Handle Notion API error responses with clear, actionable messages.
 */
function handleNotionApiError(res: Response, data: any, context: string): never {
  const status = res.status;
  const code = data?.code;
  const rawMsg = data?.message || "Unknown error";

  let userFriendly = `${context}: ${rawMsg}`;

  if (status === 401 || code === "unauthorized") {
    userFriendly = "Notion API authentication failed: Invalid internal integration token. Check NOTION_API_KEY.";
  } else if (status === 404 || code === "object_not_found") {
    userFriendly =
      "Notion database not found or access denied. Ensure NOTION_DATABASE_ID is correct and the database is shared with your integration (Database menu -> Connections -> Add connection).";
  } else if (status === 429 || code === "rate_limited") {
    userFriendly = "Notion API rate limit exceeded. Please wait a few moments and retry.";
  } else if (code === "validation_error") {
    userFriendly = `Notion schema validation error: ${rawMsg}`;
  }

  const err: any = new Error(userFriendly);
  err.status = status;
  err.notionCode = code;
  throw err;
}

/**
 * Test Connection: Verifies token, database access, and schema property types.
 */
export async function testNotionConnection(
  apiKey: string,
  databaseId: string
): Promise<NotionSyncResponse> {
  const url = `https://api.notion.com/v1/databases/${databaseId}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_API_VERSION,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    handleNotionApiError(res, data, "Failed to connect to Notion database");
  }

  const dbTitle =
    Array.isArray(data.title) && data.title.length > 0
      ? data.title.map((t: any) => t.plain_text || t.text?.content || "").join("")
      : "Manhattan Diary Database";

  const properties = data.properties || {};
  const propKeys = Object.keys(properties);

  // Check required and recommended properties
  const titleProp = Object.values(properties).find((p: any) => p.type === "title") as any;
  const hasDate = Object.values(properties).some((p: any) => p.type === "date");
  const hasScore = Object.values(properties).some((p: any) => p.type === "number");
  const hasVerdict = Object.values(properties).some(
    (p: any) => p.type === "select" || p.type === "status" || p.type === "rich_text"
  );

  const missing: string[] = [];
  const warnings: string[] = [];

  if (!titleProp) {
    missing.push("Title property");
  }
  if (!hasDate) {
    missing.push("Date (type: date)");
  }
  if (!hasScore) {
    missing.push("Score (type: number)");
  }
  if (!hasVerdict) {
    missing.push("Verdict (type: select / status / rich_text)");
  }

  // Look specifically for property names matching standard conventions
  if (properties["Score"] && properties["Score"].type !== "number") {
    warnings.push(`Property 'Score' exists but has type '${properties["Score"].type}' instead of 'number'.`);
  }
  if (properties["Date"] && properties["Date"].type !== "date") {
    warnings.push(`Property 'Date' exists but has type '${properties["Date"].type}' instead of 'date'.`);
  }

  return {
    success: true,
    message: `Successfully connected to Notion database "${dbTitle}".`,
    databaseTitle: dbTitle,
    schemaDetails: {
      propertiesFound: propKeys.map((k) => `${k} (${properties[k].type})`),
      missingProperties: missing,
      warnings: warnings.length > 0 ? warnings : undefined,
    },
  };
}

/**
 * Validates a diary entry payload before syncing. Rejects malformed or missing fields.
 */
export function validateDiaryEntry(entry: any): NotionDiarySyncEntry {
  if (!entry || typeof entry !== "object") {
    const err: any = new Error("Missing diary entry payload.");
    err.status = 400;
    throw err;
  }

  const { date, dayScore, verdict } = entry;

  if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    const err: any = new Error("Malformed or missing diary date. Expected YYYY-MM-DD.");
    err.status = 400;
    throw err;
  }

  if (typeof dayScore !== "number" || isNaN(dayScore)) {
    const err: any = new Error("Malformed or missing diary dayScore. Expected a number.");
    err.status = 400;
    throw err;
  }

  if (!verdict || typeof verdict !== "string" || verdict.trim() === "") {
    const err: any = new Error("Malformed or missing diary verdict. Expected a non-empty string.");
    err.status = 400;
    throw err;
  }

  return {
    date: date.trim(),
    title: typeof entry.title === "string" && entry.title.trim() ? entry.title.trim() : `CLERA Executive Diary — ${date.trim()}`,
    dayScore,
    verdict: verdict.trim(),
    executiveSummary: typeof entry.executiveSummary === "string" ? entry.executiveSummary.trim() : "",
    biggestWin: typeof entry.biggestWin === "string" ? entry.biggestWin.trim() : "",
    biggestExecutionLeak: typeof entry.biggestExecutionLeak === "string" ? entry.biggestExecutionLeak.trim() : "",
    tomorrowsFirstAction: typeof entry.tomorrowsFirstAction === "string" ? entry.tomorrowsFirstAction.trim() : "",
    openQuestionsBlockers: typeof entry.openQuestionsBlockers === "string" ? entry.openQuestionsBlockers.trim() : "",
    evidenceLinks: typeof entry.evidenceLinks === "string" ? entry.evidenceLinks.trim() : "",
  };
}

/**
 * Finds matching property in database schema by checking exact or case-insensitive names, or fallback to type.
 */
function findPropertyKey(
  properties: Record<string, any>,
  targetNames: string[],
  acceptedTypes: string[]
): string | null {
  // 1. Check exact/case-insensitive name match with acceptable type
  for (const name of targetNames) {
    const matchedKey = Object.keys(properties).find(
      (k) => k.toLowerCase() === name.toLowerCase() && acceptedTypes.includes(properties[k].type)
    );
    if (matchedKey) return matchedKey;
  }
  // 2. Fallback: match any property of the primary accepted type
  const fallback = Object.keys(properties).find((k) => acceptedTypes.includes(properties[k].type));
  return fallback || null;
}

/**
 * Syncs the selected diary entry to Notion:
 * Queries database first to prevent duplicates.
 * If page exists for this date, updates its properties via PATCH (preserving human-written page content).
 * If page does not exist, creates it via POST.
 */
export async function syncDiaryEntry(
  apiKey: string,
  databaseId: string,
  rawEntry: any
): Promise<NotionSyncResponse> {
  const entry = validateDiaryEntry(rawEntry);

  // 1. Fetch database schema to bind properties dynamically & correctly
  const dbRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_API_VERSION,
    },
  });
  const dbData = await dbRes.json();
  if (!dbRes.ok) {
    handleNotionApiError(dbRes, dbData, "Failed to inspect Notion database schema");
  }

  const properties = dbData.properties || {};

  // Identify property keys
  const titleKey =
    Object.keys(properties).find((k) => properties[k].type === "title") || "Name";
  const dateKey = findPropertyKey(properties, ["Date", "Day", "Log Date"], ["date"]);
  const scoreKey = findPropertyKey(properties, ["Score", "Day Score", "Total Score", "Rating"], ["number"]);
  const verdictKey = findPropertyKey(properties, ["Verdict", "Status", "Assessment"], ["select", "status", "rich_text"]);
  const summaryKey = findPropertyKey(properties, ["Summary", "Executive Summary", "Notes"], ["rich_text"]);
  const winsKey = findPropertyKey(properties, ["Wins", "Biggest Win", "Practical Work"], ["rich_text"]);
  const blockersKey = findPropertyKey(properties, ["Blockers", "Execution Leak", "Leaks"], ["rich_text"]);
  const nextActionKey = findPropertyKey(properties, ["Next Action", "Next First Action", "Tomorrow"], ["rich_text"]);
  const evidenceKey = findPropertyKey(properties, ["Evidence", "Evidence Links", "Links", "Commits"], ["url", "rich_text"]);

  // 2. Query database for existing page for this stable date key
  let existingPageId: string | null = null;
  let existingPageUrl: string | null = null;

  try {
    let filterObj: any = null;
    if (dateKey && properties[dateKey]?.type === "date") {
      filterObj = {
        property: dateKey,
        date: {
          equals: entry.date,
        },
      };
    } else {
      filterObj = {
        property: titleKey,
        title: {
          contains: entry.date,
        },
      };
    }

    const queryRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": NOTION_API_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: filterObj,
        page_size: 1,
      }),
    });

    const queryData = await queryRes.json();
    if (queryRes.ok && Array.isArray(queryData.results) && queryData.results.length > 0) {
      existingPageId = queryData.results[0].id;
      existingPageUrl = queryData.results[0].url;
    }
  } catch (err) {
    console.warn("Could not query existing Notion page by date filter, will proceed to create:", err);
  }

  // 3. Construct properties payload (Never invent missing information)
  const pageProperties: Record<string, any> = {};

  // Title
  pageProperties[titleKey] = {
    title: [
      {
        type: "text",
        text: {
          content: entry.title,
        },
      },
    ],
  };

  // Date
  if (dateKey && properties[dateKey]?.type === "date") {
    pageProperties[dateKey] = {
      date: {
        start: entry.date,
      },
    };
  }

  // Score
  if (scoreKey && properties[scoreKey]?.type === "number") {
    pageProperties[scoreKey] = {
      number: entry.dayScore,
    };
  }

  // Verdict
  if (verdictKey) {
    const vType = properties[verdictKey].type;
    if (vType === "select") {
      pageProperties[verdictKey] = {
        select: { name: entry.verdict },
      };
    } else if (vType === "status") {
      pageProperties[verdictKey] = {
        status: { name: entry.verdict },
      };
    } else if (vType === "rich_text") {
      pageProperties[verdictKey] = {
        rich_text: [{ type: "text", text: { content: entry.verdict } }],
      };
    }
  }

  // Summary
  if (summaryKey && entry.executiveSummary) {
    pageProperties[summaryKey] = {
      rich_text: [{ type: "text", text: { content: entry.executiveSummary.slice(0, 2000) } }],
    };
  }

  // Wins
  if (winsKey && entry.biggestWin) {
    pageProperties[winsKey] = {
      rich_text: [{ type: "text", text: { content: entry.biggestWin.slice(0, 2000) } }],
    };
  }

  // Blockers
  if (blockersKey && (entry.biggestExecutionLeak || entry.openQuestionsBlockers)) {
    const leakText = [entry.biggestExecutionLeak, entry.openQuestionsBlockers].filter(Boolean).join("\n\n");
    pageProperties[blockersKey] = {
      rich_text: [{ type: "text", text: { content: leakText.slice(0, 2000) } }],
    };
  }

  // Next Action
  if (nextActionKey && entry.tomorrowsFirstAction) {
    pageProperties[nextActionKey] = {
      rich_text: [{ type: "text", text: { content: entry.tomorrowsFirstAction.slice(0, 2000) } }],
    };
  }

  // Evidence Links
  if (evidenceKey && entry.evidenceLinks) {
    const eType = properties[evidenceKey].type;
    if (eType === "url" && /^https?:\/\//i.test(entry.evidenceLinks)) {
      pageProperties[evidenceKey] = {
        url: entry.evidenceLinks,
      };
    } else if (eType === "rich_text") {
      pageProperties[evidenceKey] = {
        rich_text: [{ type: "text", text: { content: entry.evidenceLinks.slice(0, 2000) } }],
      };
    }
  }

  // 4. Update existing page OR create a new page
  if (existingPageId) {
    // PATCH updates only properties, preserving any user-written blocks on the page
    const patchRes = await fetch(`https://api.notion.com/v1/pages/${existingPageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": NOTION_API_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: pageProperties,
      }),
    });

    const patchData = await patchRes.json();
    if (!patchRes.ok) {
      handleNotionApiError(patchRes, patchData, `Failed to update existing Notion page (${existingPageId})`);
    }

    return {
      success: true,
      message: `Updated existing Notion daily entry for ${entry.date}.`,
      pageId: patchData.id,
      url: patchData.url || existingPageUrl || `https://notion.so/${patchData.id.replace(/-/g, "")}`,
      updated: true,
    };
  }

  // Create new page with structured starter blocks
  const initialBlocks: any[] = [];

  if (entry.executiveSummary) {
    initialBlocks.push(
      {
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: "Executive Summary" } }],
        },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: entry.executiveSummary } }],
        },
      }
    );
  }

  if (entry.biggestWin) {
    initialBlocks.push(
      {
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: "Biggest Win / Practical Work" } }],
        },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: entry.biggestWin } }],
        },
      }
    );
  }

  if (entry.biggestExecutionLeak || entry.openQuestionsBlockers) {
    initialBlocks.push(
      {
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: "Execution Leak & Blockers" } }],
        },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              type: "text",
              text: { content: [entry.biggestExecutionLeak, entry.openQuestionsBlockers].filter(Boolean).join("\n") },
            },
          ],
        },
      }
    );
  }

  if (entry.tomorrowsFirstAction) {
    initialBlocks.push(
      {
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: "Tomorrow's Next First Action" } }],
        },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: entry.tomorrowsFirstAction } }],
        },
      }
    );
  }

  if (entry.evidenceLinks) {
    initialBlocks.push(
      {
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: "Evidence Links" } }],
        },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: entry.evidenceLinks } }],
        },
      }
    );
  }

  const createRes = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_API_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: pageProperties,
      children: initialBlocks.length > 0 ? initialBlocks : undefined,
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok) {
    handleNotionApiError(createRes, createData, "Failed to create new Notion page");
  }

  return {
    success: true,
    message: `Created new Notion daily entry for ${entry.date}.`,
    pageId: createData.id,
    url: createData.url || `https://notion.so/${createData.id.replace(/-/g, "")}`,
    updated: false,
  };
}
