import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../server";
import * as firebaseAdminModule from "../server/firebaseAdmin";
import {
  normalizeNotionDatabaseId,
  getValidatedServerConfig,
  validateDiaryEntry,
  testNotionConnection,
  syncDiaryEntry,
} from "../server/notionService";

describe("Notion Integration & Security Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = {
      ...originalEnv,
      ADMIN_FIREBASE_UID: "test-admin-uid-12345",
      NOTION_API_KEY: "secret_test_notion_key_abc",
      NOTION_DATABASE_ID: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("1. Database ID Normalization", () => {
    it("converts 32-character raw hex string into standard hyphenated UUID", () => {
      const raw = "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d";
      const normalized = normalizeNotionDatabaseId(raw);
      expect(normalized).toBe("1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d");
    });

    it("extracts 32-character hex ID from full Notion URL", () => {
      const url = "https://www.notion.so/myworkspace/1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d?v=123";
      const normalized = normalizeNotionDatabaseId(url);
      expect(normalized).toBe("1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d");
    });

    it("preserves already-hyphenated UUIDs", () => {
      const uuid = "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d";
      const normalized = normalizeNotionDatabaseId(uuid);
      expect(normalized).toBe("1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d");
    });
  });

  describe("2. Server-Side Credential Protection & Client Override Rejection", () => {
    it("rejects client-supplied apiKey with 400 Bad Request", () => {
      expect(() =>
        getValidatedServerConfig({ apiKey: "secret_hacker_override" })
      ).toThrowError(/Client-supplied Notion credentials or destination overrides are forbidden/);
    });

    it("rejects client-supplied databaseId with 400 Bad Request", () => {
      expect(() =>
        getValidatedServerConfig({ databaseId: "another-db-id" })
      ).toThrowError(/Client-supplied Notion credentials or destination overrides are forbidden/);
    });

    it("throws 500 error if NOTION_API_KEY is missing on server", () => {
      delete process.env.NOTION_API_KEY;
      expect(() => getValidatedServerConfig({})).toThrowError(
        /NOTION_API_KEY environment variable is not configured/
      );
    });

    it("throws 500 error if NOTION_DATABASE_ID is missing on server", () => {
      delete process.env.NOTION_DATABASE_ID;
      expect(() => getValidatedServerConfig({})).toThrowError(
        /NOTION_DATABASE_ID environment variable is not configured/
      );
    });

    it("successfully loads and normalizes credentials when configured on server", () => {
      const config = getValidatedServerConfig({});
      expect(config.apiKey).toBe("secret_test_notion_key_abc");
      expect(config.databaseId).toBe("1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d");
    });
  });

  describe("3. Diary Payload Validation & No Invented Values", () => {
    it("validates valid diary entry correctly", () => {
      const valid = {
        date: "2026-09-09",
        dayScore: 92,
        verdict: "Strong Execution",
        executiveSummary: "Completed all key objectives.",
        biggestWin: "Built Notion integration.",
        biggestExecutionLeak: "Context switching",
        tomorrowsFirstAction: "Deploy to staging",
      };
      const result = validateDiaryEntry(valid);
      expect(result.date).toBe("2026-09-09");
      expect(result.dayScore).toBe(92);
      expect(result.verdict).toBe("Strong Execution");
      expect(result.evidenceLinks).toBe(""); // Not invented when missing
    });

    it("rejects invalid or missing dates", () => {
      expect(() => validateDiaryEntry({ dayScore: 80, verdict: "Pass" })).toThrowError(
        /Malformed or missing diary date/
      );
      expect(() =>
        validateDiaryEntry({ date: "09-09-2026", dayScore: 80, verdict: "Pass" })
      ).toThrowError(/Malformed or missing diary date/);
    });

    it("rejects non-numeric dayScore", () => {
      expect(() =>
        validateDiaryEntry({ date: "2026-09-09", dayScore: "invalid", verdict: "Pass" })
      ).toThrowError(/Malformed or missing diary dayScore/);
    });

    it("rejects empty verdict", () => {
      expect(() =>
        validateDiaryEntry({ date: "2026-09-09", dayScore: 85, verdict: "   " })
      ).toThrowError(/Malformed or missing diary verdict/);
    });
  });

  describe("4. Test Connection & Schema Introspection", () => {
    it("handles 401 unauthorized token from Notion", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ code: "unauthorized", message: "API token is invalid." }),
      } as Response);

      await expect(
        testNotionConnection("bad_key", "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d")
      ).rejects.toThrowError(/Invalid internal integration token/);
    });

    it("handles 404 object_not_found database access denied", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ code: "object_not_found", message: "Could not find database." }),
      } as Response);

      await expect(
        testNotionConnection("valid_key", "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d")
      ).rejects.toThrowError(/Notion database not found or access denied/);
    });

    it("succeeds and inspects schema property types", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          title: [{ plain_text: "Manhattan Daily Reports" }],
          properties: {
            Name: { type: "title" },
            Date: { type: "date" },
            Score: { type: "number" },
            Verdict: { type: "select" },
          },
        }),
      } as Response);

      const result = await testNotionConnection("valid_key", "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d");
      expect(result.success).toBe(true);
      expect(result.databaseTitle).toBe("Manhattan Daily Reports");
      expect(result.schemaDetails?.propertiesFound).toContain("Name (title)");
      expect(result.schemaDetails?.propertiesFound).toContain("Score (number)");
    });
  });

  describe("5. Duplicate Prevention & Upsert Logic", () => {
    it("creates a new page when date does not exist yet", async () => {
      const fetchMock = vi.spyOn(global, "fetch");

      // 1. Database schema fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          properties: {
            Name: { type: "title" },
            Date: { type: "date" },
            Score: { type: "number" },
            Verdict: { type: "select" },
          },
        }),
      } as Response);

      // 2. Query returns 0 existing results
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response);

      // 3. Create page via POST
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "new-page-id-999", url: "https://notion.so/new-page-id-999" }),
      } as Response);

      const res = await syncDiaryEntry("key", "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d", {
        date: "2026-09-09",
        dayScore: 95,
        verdict: "Exemplary",
      });

      expect(res.success).toBe(true);
      expect(res.updated).toBe(false);
      expect(res.pageId).toBe("new-page-id-999");
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("updates existing page via PATCH without deleting page body when date already exists", async () => {
      const fetchMock = vi.spyOn(global, "fetch");

      // 1. Database schema fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          properties: {
            Name: { type: "title" },
            Date: { type: "date" },
            Score: { type: "number" },
            Verdict: { type: "select" },
          },
        }),
      } as Response);

      // 2. Query returns 1 existing page
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ id: "existing-page-id-123", url: "https://notion.so/existing-page-id-123" }],
        }),
      } as Response);

      // 3. Update page properties via PATCH
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "existing-page-id-123", url: "https://notion.so/existing-page-id-123" }),
      } as Response);

      const res = await syncDiaryEntry("key", "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d", {
        date: "2026-09-09",
        dayScore: 98,
        verdict: "Exemplary",
      });

      expect(res.success).toBe(true);
      expect(res.updated).toBe(true);
      expect(res.pageId).toBe("existing-page-id-123");

      // Verify PATCH was called for update
      const patchCall = fetchMock.mock.calls[2];
      expect(patchCall[0]).toContain("https://api.notion.com/v1/pages/existing-page-id-123");
      expect(patchCall[1]?.method).toBe("PATCH");
    });
  });

  describe("6. HTTP Endpoint Authentication & Authorization (/api/notion/sync)", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const res = await request(app).post("/api/notion/sync").send({ action: "test" });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Missing Firebase ID token/);
    });

    it("rejects invalid Firebase ID tokens with 401", async () => {
      vi.spyOn(firebaseAdminModule, "verifyOwnerAuth").mockRejectedValueOnce(
        Object.assign(new Error("Authentication failed: Invalid or expired Firebase ID token"), { status: 401 })
      );

      const res = await request(app)
        .post("/api/notion/sync")
        .set("Authorization", "Bearer invalid-token-xyz")
        .send({ action: "test" });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid or expired Firebase ID token/);
    });

    it("rejects unauthorized users whose UID does not match ADMIN_FIREBASE_UID with 403 Forbidden", async () => {
      vi.spyOn(firebaseAdminModule, "verifyOwnerAuth").mockRejectedValueOnce(
        Object.assign(new Error("Forbidden: User is not authorized to access Notion integration."), { status: 403 })
      );

      const res = await request(app)
        .post("/api/notion/sync")
        .set("Authorization", "Bearer token-from-unauthorized-user")
        .send({ action: "test" });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden: User is not authorized/);
    });

    it("rejects client attempts to override apiKey with 400 Bad Request", async () => {
      const res = await request(app)
        .post("/api/notion/sync")
        .set("Authorization", "Bearer any-token")
        .send({
          action: "test",
          apiKey: "override_key",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Client-supplied Notion credentials or destination overrides are forbidden/);
    });

    it("rejects client attempts to override databaseId with 400 Bad Request", async () => {
      const res = await request(app)
        .post("/api/notion/sync")
        .set("Authorization", "Bearer any-token")
        .send({
          action: "test",
          databaseId: "override_db",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Client-supplied Notion credentials or destination overrides are forbidden/);
    });

    it("authorizes valid admin UID and succeeds for test action", async () => {
      vi.spyOn(firebaseAdminModule, "verifyOwnerAuth").mockResolvedValueOnce({
        uid: "test-admin-uid-12345",
      } as any);

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          title: [{ plain_text: "Manhattan Tracker" }],
          properties: {
            Name: { type: "title" },
            Date: { type: "date" },
            Score: { type: "number" },
            Verdict: { type: "select" },
          },
        }),
      } as Response);

      const res = await request(app)
        .post("/api/notion/sync")
        .set("Authorization", "Bearer valid-admin-token")
        .send({ action: "test" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.databaseTitle).toBe("Manhattan Tracker");
    });
  });
});
