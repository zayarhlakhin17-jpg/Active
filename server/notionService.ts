import type {
  NotionDiarySyncEntry,
  NotionSyncResponse
} from "../src/types.js";

export const NOTION_API_VERSION = "2022-06-28";
export const NOTION_TEXT_CHUNK_LIMIT = 2000;
export const NOTION_MAX_RICH_TEXT_CHUNKS = 100;
export const NOTION_FIELD_MAX_LENGTH = NOTION_TEXT_CHUNK_LIMIT * NOTION_MAX_RICH_TEXT_CHUNKS; // 200,000 characters

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
 * Handle Notion API error responses with clear, actionable messages, preserving retry-after headers.
 */
export function handleNotionApiError(res: Response, data: any, context: string): never {
  const status = res.status;
  const code = data?.code;
  const rawMsg = data?.message || "Unknown error";

  let userFriendly = `${context}: ${rawMsg}`;

  const retryAfter = res.headers?.get?.("retry-after") || res.headers?.get?.("Retry-After");

  if (status === 401 || code === "unauthorized") {
    userFriendly = "Notion API authentication failed: Invalid internal integration token. Check NOTION_API_KEY.";
  } else if (status === 404 || code === "object_not_found") {
    userFriendly =
      "Notion database not found or access denied. Ensure NOTION_DATABASE_ID is correct and the database is shared with your integration (Database menu -> Connections -> Add connection).";
  } else if (status === 429 || code === "rate_limited") {
    userFriendly = retryAfter
      ? `Notion API rate limit exceeded. Retry after ${retryAfter} seconds.`
      : "Notion API rate limit exceeded. Please wait a few moments and retry.";
  } else if (code === "validation_error") {
    userFriendly = `Notion schema validation error: ${rawMsg}`;
  }

  const err: any = new Error(userFriendly);
  err.status = status;
  err.notionCode = code;
  if (retryAfter) {
    err.retryAfter = retryAfter;
  }
  throw err;
}

/**
 * Splits arbitrary length text into Notion rich_text objects of max 2000 chars each.
 * Throws an error before writing if the text exceeds Notion's total capacity (200,000 chars),
 * ensuring zero content is silently dropped or lost.
 */
export function splitTextToRichText(
  text: string,
  fieldName: string = "field"
): Array<{ type: "text"; text: { content: string } }> {
  if (!text) return [];

  if (text.length > NOTION_FIELD_MAX_LENGTH) {
    const err: any = new Error(
      `Cannot export entry without data loss: '${fieldName}' length (${text.length} characters) exceeds Notion maximum capacity (${NOTION_FIELD_MAX_LENGTH} characters).`
    );
    err.status = 400;
    throw err;
  }

  const chunks: Array<{ type: "text"; text: { content: string } }> = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= NOTION_TEXT_CHUNK_LIMIT) {
      chunks.push({
        type: "text",
        text: { content: remaining },
      });
      break;
    }

    // Attempt to split cleanly near newline or word boundary within 2000 character limit
    let splitPoint = NOTION_TEXT_CHUNK_LIMIT;
    const window = remaining.slice(0, NOTION_TEXT_CHUNK_LIMIT);
    const lastNewline = window.lastIndexOf("\n");
    const lastSpace = window.lastIndexOf(" ");

    if (lastNewline > NOTION_TEXT_CHUNK_LIMIT - 300) {
      splitPoint = lastNewline + 1;
    } else if (lastSpace > NOTION_TEXT_CHUNK_LIMIT - 150) {
      splitPoint = lastSpace + 1;
    }

    chunks.push({
      type: "text",
      text: { content: remaining.slice(0, splitPoint) },
    });
    remaining = remaining.slice(splitPoint);
  }

  return chunks;
}

/**
 * Validates a diary entry payload before syncing.
 * Strictly validates calendar dates (including valid days in month and leap years).
 * Validates dayScore between 0 and 100 inclusive (score of 0 is legitimate).
 */
export function validateDiaryEntry(entry: any): NotionDiarySyncEntry {
  if (!entry || typeof entry !== "object") {
    const err: any = new Error("Missing diary entry payload.");
    err.status = 400;
    throw err;
  }

  const { date, dayScore, verdict } = entry;

  if (!date || typeof date !== "string") {
    const err: any = new Error("Malformed or missing diary date. Expected YYYY-MM-DD.");
    err.status = 400;
    throw err;
  }

  const trimmedDate = date.trim();
  const dateMatch = trimmedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) {
    const err: any = new Error("Malformed diary date format. Expected strictly YYYY-MM-DD.");
    err.status = 400;
    throw err;
  }

  const year = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10);
  const day = parseInt(dateMatch[3], 10);

  if (year < 1970 || year > 2100) {
    const err: any = new Error(`Invalid calendar date: year ${year} is out of realistic range.`);
    err.status = 400;
    throw err;
  }

  if (month < 1 || month > 12) {
    const err: any = new Error(`Invalid calendar date: month ${month} must be between 01 and 12.`);
    err.status = 400;
    throw err;
  }

  // Days in month calculation (UTC based to avoid daylight savings quirks)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) {
    const err: any = new Error(
      `Invalid calendar date: ${trimmedDate} is impossible (${year}-${dateMatch[2]} has only ${daysInMonth} days).`
    );
    err.status = 400;
    throw err;
  }

  // dayScore must be a number between 0 and 100 inclusive
  if (typeof dayScore !== "number" || isNaN(dayScore)) {
    const err: any = new Error("Malformed or missing diary dayScore. Expected a number.");
    err.status = 400;
    throw err;
  }

  if (dayScore < 0 || dayScore > 100) {
    const err: any = new Error(
      `Invalid dayScore: ${dayScore}. Score must be between 0 and 100 inclusive.`
    );
    err.status = 400;
    throw err;
  }

  if (!verdict || typeof verdict !== "string" || verdict.trim() === "") {
    const err: any = new Error("Malformed or missing diary verdict. Expected a non-empty string.");
    err.status = 400;
    throw err;
  }

  return {
    date: trimmedDate,
    title: typeof entry.title === "string" && entry.title.trim() ? entry.title.trim() : `CLERA Executive Diary — ${trimmedDate}`,
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

export interface FieldDefinition {
  field: string;
  label: string;
  required: boolean;
  supportedNames: string[];
  acceptedTypes: string[];
}

export const DIARY_FIELD_DEFINITIONS: Record<string, FieldDefinition> = {
  title: {
    field: "title",
    label: "Title",
    required: true,
    supportedNames: ["Name", "Title", "Diary", "Entry", "Log"],
    acceptedTypes: ["title"],
  },
  date: {
    field: "date",
    label: "Date",
    required: true,
    supportedNames: ["Date", "Day", "Log Date", "Entry Date", "Diary Date"],
    acceptedTypes: ["date"],
  },
  score: {
    field: "score",
    label: "Score",
    required: true,
    supportedNames: ["Score", "Day Score", "Total Score", "Daily Score", "Audit Score", "Rating"],
    acceptedTypes: ["number"],
  },
  verdict: {
    field: "verdict",
    label: "Verdict",
    required: true,
    supportedNames: ["Verdict", "Assessment", "Day Verdict", "Manager Assessment", "Status"],
    acceptedTypes: ["select", "status", "rich_text"],
  },
  summary: {
    field: "summary",
    label: "Executive Summary",
    required: false,
    supportedNames: ["Summary", "Executive Summary", "Notes", "Daily Summary"],
    acceptedTypes: ["rich_text"],
  },
  wins: {
    field: "wins",
    label: "Biggest Win",
    required: false,
    supportedNames: ["Wins", "Biggest Win", "Practical Work", "Practical Work Built", "Accomplishments"],
    acceptedTypes: ["rich_text"],
  },
  blockers: {
    field: "blockers",
    label: "Execution Leak & Blockers",
    required: false,
    supportedNames: ["Blockers", "Execution Leak", "Biggest Execution Leak", "Leaks", "Obstacles", "Open Questions"],
    acceptedTypes: ["rich_text"],
  },
  nextAction: {
    field: "nextAction",
    label: "Tomorrow's Action",
    required: false,
    supportedNames: ["Next Action", "Next First Action", "Tomorrow", "Tomorrow's Action", "Action Item"],
    acceptedTypes: ["rich_text"],
  },
  evidence: {
    field: "evidence",
    label: "Evidence",
    required: false,
    supportedNames: ["Evidence", "Evidence Links", "Links", "Commits", "Git Commits", "Artifacts"],
    acceptedTypes: ["url", "rich_text"],
  },
};

export interface SchemaResolutionResult {
  schemaValid: boolean;
  readyToSync: boolean;
  mapping: Record<string, string | null>;
  errors: string[];
  warnings: string[];
}

/**
 * Inspects Notion database properties using explicit supported names and strict type checking.
 * - Never falls back to arbitrary properties of the same type.
 * - Never maps multiple diary fields to the same Notion property.
 * - Missing or incompatible required properties block synchronization.
 * - Missing optional properties are left unmapped and do NOT overwrite other fields.
 */
export function resolveSchemaMapping(properties: Record<string, any>): SchemaResolutionResult {
  const mapping: Record<string, string | null> = {};
  const usedPropertyKeys = new Set<string>();
  const errors: string[] = [];
  const warnings: string[] = [];

  const propKeys = Object.keys(properties);

  // 1. Resolve Title property: Notion requires exactly one property of type 'title'
  const titlePropKey = propKeys.find((k) => properties[k].type === "title");
  if (titlePropKey) {
    mapping.title = titlePropKey;
    usedPropertyKeys.add(titlePropKey);
  } else {
    errors.push("Missing required Title property (type: title).");
  }

  // 2. Resolve other fields in order
  for (const [fieldKey, def] of Object.entries(DIARY_FIELD_DEFINITIONS)) {
    if (fieldKey === "title") continue; // already handled

    let matchedKey: string | null = null;

    // Check each supported name case-insensitively
    for (const name of def.supportedNames) {
      const found = propKeys.find((k) => k.toLowerCase() === name.toLowerCase());
      if (found) {
        // Verify it isn't already assigned to another field
        if (usedPropertyKeys.has(found)) {
          warnings.push(
            `Property '${found}' matched multiple fields and was already reserved for another field.`
          );
          continue;
        }

        const propType = properties[found]?.type;
        if (def.acceptedTypes.includes(propType)) {
          matchedKey = found;
          break;
        } else {
          // Property exists with correct name but incompatible type
          const expected = def.acceptedTypes.join(" or ");
          if (def.required) {
            errors.push(
              `Required property '${found}' has incompatible type '${propType}'. Expected ${expected}.`
            );
          } else {
            warnings.push(
              `Optional property '${found}' has incompatible type '${propType}'. Expected ${expected}.`
            );
          }
        }
      }
    }

    if (matchedKey) {
      mapping[fieldKey] = matchedKey;
      usedPropertyKeys.add(matchedKey);
    } else {
      mapping[fieldKey] = null;
      if (def.required && !errors.some((e) => e.includes(def.label))) {
        errors.push(
          `Missing required property for ${def.label}. Expected name matching [${def.supportedNames.join(", ")}] with type [${def.acceptedTypes.join(", ")}].`
        );
      }
    }
  }

  const schemaValid = errors.length === 0;
  return {
    schemaValid,
    readyToSync: schemaValid,
    mapping,
    errors,
    warnings,
  };
}

/**
 * Test Connection: Verifies integration token, database access, and schema validity.
 * Distinguishes "database accessible" from "schema valid and ready to sync".
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
  const schemaResolution = resolveSchemaMapping(properties);

  const message = schemaResolution.readyToSync
    ? `Successfully connected to Notion database "${dbTitle}". Schema is valid and ready to sync.`
    : `Connected to Notion database "${dbTitle}", but schema is incomplete or incompatible for sync.`;

  return {
    success: true,
    databaseAccessible: true,
    schemaValid: schemaResolution.schemaValid,
    readyToSync: schemaResolution.readyToSync,
    message,
    databaseTitle: dbTitle,
    schemaDetails: {
      propertiesFound: Object.keys(properties).map((k) => `${k} (${properties[k].type})`),
      missingProperties: schemaResolution.errors,
      warnings: schemaResolution.warnings.length > 0 ? schemaResolution.warnings : undefined,
    },
  };
}

// In-flight concurrency lock per databaseId:date to ensure sequential, duplicate-safe execution
const inFlightSyncLocks = new Map<string, Promise<NotionSyncResponse>>();

/**
 * Core implementation of diary sync.
 * 1. Validates schema: required properties missing/incompatible block sync.
 * 2. Queries database for duplicates: any query failure (HTTP, network, 429, malformed) ABORTS immediately.
 * 3. If multiple matching pages found: aborts with 409 conflict.
 * 4. If exactly 1 match found: updates properties via PATCH (preserving body blocks).
 * 5. If 0 matches confirmed: creates new page via POST with full content preserved.
 */
async function executeSyncDiaryEntry(
  apiKey: string,
  databaseId: string,
  entry: NotionDiarySyncEntry
): Promise<NotionSyncResponse> {
  // 1. Fetch database schema to bind properties dynamically
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
  const schema = resolveSchemaMapping(properties);

  // Missing or incompatible required properties block synchronization
  if (!schema.readyToSync) {
    const err: any = new Error(
      `Cannot synchronize entry: Schema validation failed. ${schema.errors.join(" ")}`
    );
    err.status = 400;
    throw err;
  }

  const { mapping } = schema;
  const titleKey = mapping.title!;
  const dateKey = mapping.date!;
  const scoreKey = mapping.score!;
  const verdictKey = mapping.verdict!;

  // 2. Query database for existing page with this exact date
  // A FAILED DATABASE QUERY MUST NEVER FALL THROUGH TO CREATING A NEW PAGE!
  let queryRes: Response;
  try {
    queryRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": NOTION_API_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          property: dateKey,
          date: {
            equals: entry.date,
          },
        },
        page_size: 10,
      }),
    });
  } catch (netErr: any) {
    const err: any = new Error(
      `Network error during duplicate check: ${netErr.message || "Unable to reach Notion API"}. Aborting sync.`
    );
    err.status = 502;
    throw err;
  }

  const queryData = await queryRes.json();
  if (!queryRes.ok) {
    // Abort immediately on HTTP error or 429
    handleNotionApiError(queryRes, queryData, "Failed to query database for duplicates");
  }

  if (!queryData || !Array.isArray(queryData.results)) {
    const err: any = new Error(
      "Malformed query response received from Notion API. Aborting sync to prevent duplicates."
    );
    err.status = 502;
    throw err;
  }

  // Detect multiple existing matches and report a conflict instead of silently updating first
  if (queryData.results.length > 1) {
    const conflictErr: any = new Error(
      `Duplicate conflict: Found ${queryData.results.length} existing Notion pages for date ${entry.date}. Aborting sync. Please resolve duplicate entries in your Notion database before syncing.`
    );
    conflictErr.status = 409;
    throw conflictErr;
  }

  let existingPageId: string | null = null;
  let existingPageUrl: string | null = null;

  if (queryData.results.length === 1) {
    existingPageId = queryData.results[0].id;
    existingPageUrl = queryData.results[0].url;
  }

  // 3. Construct properties payload (Zero silent truncation, preserving long text)
  const pageProperties: Record<string, any> = {};

  // Title
  pageProperties[titleKey] = {
    title: splitTextToRichText(entry.title, "title"),
  };

  // Date
  pageProperties[dateKey] = {
    date: {
      start: entry.date,
    },
  };

  // Score (Preserves legitimate score of 0)
  pageProperties[scoreKey] = {
    number: entry.dayScore,
  };

  // Verdict
  const verdictPropType = properties[verdictKey].type;
  if (verdictPropType === "select") {
    pageProperties[verdictKey] = {
      select: { name: entry.verdict },
    };
  } else if (verdictPropType === "status") {
    pageProperties[verdictKey] = {
      status: { name: entry.verdict },
    };
  } else if (verdictPropType === "rich_text") {
    pageProperties[verdictKey] = {
      rich_text: splitTextToRichText(entry.verdict, "verdict"),
    };
  }

  // Summary (Optional)
  if (mapping.summary && entry.executiveSummary) {
    pageProperties[mapping.summary] = {
      rich_text: splitTextToRichText(entry.executiveSummary, "executiveSummary"),
    };
  }

  // Wins (Optional)
  if (mapping.wins && entry.biggestWin) {
    pageProperties[mapping.wins] = {
      rich_text: splitTextToRichText(entry.biggestWin, "biggestWin"),
    };
  }

  // Blockers (Optional)
  if (mapping.blockers && (entry.biggestExecutionLeak || entry.openQuestionsBlockers)) {
    const combined = [entry.biggestExecutionLeak, entry.openQuestionsBlockers].filter(Boolean).join("\n\n");
    pageProperties[mapping.blockers] = {
      rich_text: splitTextToRichText(combined, "blockers"),
    };
  }

  // Next Action (Optional)
  if (mapping.nextAction && entry.tomorrowsFirstAction) {
    pageProperties[mapping.nextAction] = {
      rich_text: splitTextToRichText(entry.tomorrowsFirstAction, "tomorrowsFirstAction"),
    };
  }

  // Evidence Links (Optional)
  if (mapping.evidence && entry.evidenceLinks) {
    const evidenceType = properties[mapping.evidence].type;
    if (evidenceType === "url" && /^https?:\/\//i.test(entry.evidenceLinks)) {
      pageProperties[mapping.evidence] = {
        url: entry.evidenceLinks,
      };
    } else {
      pageProperties[mapping.evidence] = {
        rich_text: splitTextToRichText(entry.evidenceLinks, "evidenceLinks"),
      };
    }
  }

  // 4. Update existing page OR create new page
  if (existingPageId) {
    // PATCH updates properties without modifying body blocks
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

  // 5. Create new page: Page-body structured blocks with full text preservation
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
          rich_text: splitTextToRichText(entry.executiveSummary, "executiveSummary"),
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
          rich_text: splitTextToRichText(entry.biggestWin, "biggestWin"),
        },
      }
    );
  }

  if (entry.biggestExecutionLeak || entry.openQuestionsBlockers) {
    const combinedBlockers = [entry.biggestExecutionLeak, entry.openQuestionsBlockers].filter(Boolean).join("\n\n");
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
          rich_text: splitTextToRichText(combinedBlockers, "blockers"),
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
          rich_text: splitTextToRichText(entry.tomorrowsFirstAction, "tomorrowsFirstAction"),
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
          rich_text: splitTextToRichText(entry.evidenceLinks, "evidenceLinks"),
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

/**
 * Entry point for syncing diary entry to Notion.
 * Enforces per-date in-flight mutex lock to ensure concurrent requests are duplicate-safe.
 */
export async function syncDiaryEntry(
  apiKey: string,
  databaseId: string,
  rawEntry: any
): Promise<NotionSyncResponse> {
  const entry = validateDiaryEntry(rawEntry);
  const lockKey = `${databaseId}:${entry.date}`;

  // Wait for any existing in-flight sync for this date to settle
  while (inFlightSyncLocks.has(lockKey)) {
    try {
      await inFlightSyncLocks.get(lockKey);
    } catch {
      // ignore rejection from previous sync, then retry
    }
  }

  const executionPromise = executeSyncDiaryEntry(apiKey, databaseId, entry);
  inFlightSyncLocks.set(lockKey, executionPromise);

  try {
    return await executionPromise;
  } finally {
    if (inFlightSyncLocks.get(lockKey) === executionPromise) {
      inFlightSyncLocks.delete(lockKey);
    }
  }
}
