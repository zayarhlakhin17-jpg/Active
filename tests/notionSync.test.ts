import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import app from "../server.js";
import { verifyOwnerAuth } from "../server/firebaseAdmin.js";
import {
  normalizeNotionDatabaseId,
  getValidatedServerConfig,
  validateDiaryEntry,
  testNotionConnection,
  syncDiaryEntry,
  splitTextToRichText,
  resolveSchemaMapping,
  NOTION_FIELD_MAX_LENGTH,
} from "../server/notionService.js";

const mockVerifyIdToken = vi.fn();

vi.mock("firebase-admin/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase-admin/auth")>();
  return {
    ...actual,
    getAuth: vi.fn(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
  };
});

describe("Notion Integration & Security Hardening Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      ADMIN_FIREBASE_UID: "test-admin-owner-uid-999",
      NOTION_API_KEY: "secret_test_notion_key_abc",
      NOTION_DATABASE_ID: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("1. Real verifyOwnerAuth() Function (Mocking only Firebase SDK)", () => {
    it("rejects missing, null, or empty ID tokens with 401", async () => {
      await expect(verifyOwnerAuth(undefined)).rejects.toMatchObject({
        status: 401,
        message: expect.stringMatching(/Missing Firebase ID token/),
      });
      await expect(verifyOwnerAuth(null)).rejects.toMatchObject({
        status: 401,
        message: expect.stringMatching(/Missing Firebase ID token/),
      });
      await expect(verifyOwnerAuth("   ")).rejects.toMatchObject({
        status: 401,
        message: expect.stringMatching(/Missing Firebase ID token/),
      });
    });

    it("rejects when ADMIN_FIREBASE_UID is missing from server env with 500", async () => {
      delete process.env.ADMIN_FIREBASE_UID;
      await expect(verifyOwnerAuth("some-token")).rejects.toMatchObject({
        status: 500,
        message: expect.stringMatching(/ADMIN_FIREBASE_UID is not configured/),
      });
    });

    it("rejects invalid tokens where Firebase SDK throws with 401", async () => {
      mockVerifyIdToken.mockRejectedValueOnce(new Error("Firebase ID token has expired"));

      await expect(verifyOwnerAuth("expired-token")).rejects.toMatchObject({
        status: 401,
        message: expect.stringMatching(/Authentication failed: Firebase ID token has expired/),
      });
    });

    it("rejects non-owner UID where token is valid but UID does not match ADMIN_FIREBASE_UID with 403", async () => {
      mockVerifyIdToken.mockResolvedValueOnce({
        uid: "intruder-uid-456",
        email: "intruder@example.com",
      });

      await expect(verifyOwnerAuth("valid-token-for-other-user")).rejects.toMatchObject({
        status: 403,
        message: expect.stringMatching(/Forbidden: User is not authorized/),
      });
    });

    it("authorizes matching owner UID and returns decoded token", async () => {
      mockVerifyIdToken.mockResolvedValueOnce({
        uid: "test-admin-owner-uid-999",
        email: "owner@example.com",
      });

      const decoded = await verifyOwnerAuth("valid-owner-token");
      expect(decoded.uid).toBe("test-admin-owner-uid-999");
      expect(decoded.email).toBe("owner@example.com");
    });
  });

  describe("2. Calendar Date and Score Validation", () => {
    it("validates legitimate calendar dates accurately", () => {
      const entry = validateDiaryEntry({
        date: "2026-09-09",
        dayScore: 95,
        verdict: "Strong",
      });
      expect(entry.date).toBe("2026-09-09");
      expect(entry.dayScore).toBe(95);
    });

    it("preserves a legitimate score of 0", () => {
      const entry = validateDiaryEntry({
        date: "2026-09-09",
        dayScore: 0,
        verdict: "Missed Target",
      });
      expect(entry.dayScore).toBe(0);
    });

    it("rejects negative scores", () => {
      expect(() =>
        validateDiaryEntry({ date: "2026-09-09", dayScore: -1, verdict: "Fail" })
      ).toThrowError(/Score must be between 0 and 100/);
    });

    it("rejects scores over 100", () => {
      expect(() =>
        validateDiaryEntry({ date: "2026-09-09", dayScore: 105, verdict: "Pass" })
      ).toThrowError(/Score must be between 0 and 100/);
    });

    it("rejects non-numeric scores", () => {
      expect(() =>
        validateDiaryEntry({ date: "2026-09-09", dayScore: "ninety", verdict: "Pass" })
      ).toThrowError(/Expected a number/);
    });

    it("rejects impossible calendar dates (non-leap year Feb 29)", () => {
      expect(() =>
        validateDiaryEntry({ date: "2026-02-29", dayScore: 80, verdict: "Pass" })
      ).toThrowError(/Invalid calendar date/);
    });

    it("accepts valid leap year Feb 29", () => {
      const entry = validateDiaryEntry({
        date: "2024-02-29",
        dayScore: 80,
        verdict: "Pass",
      });
      expect(entry.date).toBe("2024-02-29");
    });

    it("rejects impossible calendar dates (April 31)", () => {
      expect(() =>
        validateDiaryEntry({ date: "2026-04-31", dayScore: 80, verdict: "Pass" })
      ).toThrowError(/Invalid calendar date/);
    });

    it("rejects invalid months (month 13 or 00)", () => {
      expect(() =>
        validateDiaryEntry({ date: "2026-13-01", dayScore: 80, verdict: "Pass" })
      ).toThrowError(/month 13 must be between 01 and 12/);
      expect(() =>
        validateDiaryEntry({ date: "2026-00-10", dayScore: 80, verdict: "Pass" })
      ).toThrowError(/month 0 must be between 01 and 12/);
    });

    it("rejects empty verdict", () => {
      expect(() =>
        validateDiaryEntry({ date: "2026-09-09", dayScore: 80, verdict: "   " })
      ).toThrowError(/Malformed or missing diary verdict/);
    });
  });

  describe("3. Long Text Preservation & Splitting", () => {
    it("does not truncate text under 2000 characters", () => {
      const text = "A".repeat(500);
      const result = splitTextToRichText(text, "test");
      expect(result).toHaveLength(1);
      expect(result[0].text.content).toBe(text);
    });

    it("splits text over 2000 characters into multiple chunks without losing characters", () => {
      const part1 = "First part of long diary notes ".repeat(80); // ~2480 chars
      const part2 = "Second paragraph with details ".repeat(80);
      const fullText = `${part1}\n\n${part2}`;

      const chunks = splitTextToRichText(fullText, "executiveSummary");
      expect(chunks.length).toBeGreaterThan(1);

      // Verify every chunk respects Notion's 2000 char limit
      chunks.forEach((chunk) => {
        expect(chunk.text.content.length).toBeLessThanOrEqual(2000);
      });

      // Verify ZERO characters are lost
      const reconstructed = chunks.map((c) => c.text.content).join("");
      expect(reconstructed).toBe(fullText);
    });

    it("throws before writing if text exceeds Notion's total capacity (200,000 chars)", () => {
      const hugeText = "X".repeat(NOTION_FIELD_MAX_LENGTH + 10);
      expect(() => splitTextToRichText(hugeText, "massiveField")).toThrowError(
        /Cannot export entry without data loss.*exceeds Notion maximum capacity/
      );
    });
  });

  describe("4. Schema Resolution & Property Mapping Safety", () => {
    it("correctly resolves valid schema with supported names", () => {
      const properties = {
        Name: { type: "title" },
        Date: { type: "date" },
        Score: { type: "number" },
        Verdict: { type: "select" },
        "Executive Summary": { type: "rich_text" },
        "Biggest Win": { type: "rich_text" },
      };

      const result = resolveSchemaMapping(properties);
      expect(result.schemaValid).toBe(true);
      expect(result.readyToSync).toBe(true);
      expect(result.mapping.title).toBe("Name");
      expect(result.mapping.date).toBe("Date");
      expect(result.mapping.score).toBe("Score");
      expect(result.mapping.verdict).toBe("Verdict");
      expect(result.mapping.summary).toBe("Executive Summary");
      expect(result.mapping.wins).toBe("Biggest Win");
    });

    it("blocks synchronization if required property (Score) has incompatible type", () => {
      const properties = {
        Name: { type: "title" },
        Date: { type: "date" },
        Score: { type: "rich_text" }, // Invalid: must be number!
        Verdict: { type: "select" },
      };

      const result = resolveSchemaMapping(properties);
      expect(result.schemaValid).toBe(false);
      expect(result.readyToSync).toBe(false);
      expect(result.errors.some((e) => e.includes("Score") && e.includes("incompatible type"))).toBe(true);
    });

    it("blocks synchronization if required Date property is missing", () => {
      const properties = {
        Name: { type: "title" },
        Score: { type: "number" },
        Verdict: { type: "select" },
      };

      const result = resolveSchemaMapping(properties);
      expect(result.schemaValid).toBe(false);
      expect(result.readyToSync).toBe(false);
      expect(result.errors.some((e) => e.includes("Date"))).toBe(true);
    });

    it("does NOT fall back to arbitrary properties of the same type", () => {
      const properties = {
        Name: { type: "title" },
        "Random Unrelated Number": { type: "number" }, // Should not be picked as Score!
        Date: { type: "date" },
        Verdict: { type: "select" },
      };

      const result = resolveSchemaMapping(properties);
      expect(result.schemaValid).toBe(false);
      expect(result.mapping.score).toBeNull();
      expect(result.errors.some((e) => e.includes("Score"))).toBe(true);
    });

    it("prevents multiple fields from mapping to the same Notion property", () => {
      const properties = {
        Name: { type: "title" },
        Date: { type: "date" },
        Score: { type: "number" },
        Verdict: { type: "rich_text" }, // Could match verdict
        Summary: { type: "rich_text" },
      };

      const result = resolveSchemaMapping(properties);
      expect(result.mapping.verdict).toBe("Verdict");
      expect(result.mapping.summary).toBe("Summary");
      expect(result.mapping.verdict).not.toBe(result.mapping.summary);
    });

    it("testNotionConnection distinguishes database accessible from schema ready to sync", async () => {
      // Database accessible, but missing Score property
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          title: [{ plain_text: "Incomplete Database" }],
          properties: {
            Name: { type: "title" },
            Date: { type: "date" },
            Verdict: { type: "select" },
            // Missing Score!
          },
        }),
      } as Response);

      const res = await testNotionConnection("key", "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d");
      expect(res.databaseAccessible).toBe(true);
      expect(res.schemaValid).toBe(false);
      expect(res.readyToSync).toBe(false);
      expect(res.message).toContain("schema is incomplete or incompatible");
    });
  });

  describe("5. Stop on Failed Duplicate Lookup (Never Fall Through to Create)", () => {
    const validDbSchema = {
      properties: {
        Name: { type: "title" },
        Date: { type: "date" },
        Score: { type: "number" },
        Verdict: { type: "select" },
      },
    };

    it("aborts sync immediately when duplicate query returns HTTP 500 error", async () => {
      const fetchMock = vi.spyOn(global, "fetch");

      // 1. Schema fetch succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => validDbSchema,
      } as Response);

      // 2. Query fails with 500
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ code: "internal_server_error", message: "Notion service failure" }),
      } as Response);

      await expect(
        syncDiaryEntry("key", "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d", {
          date: "2026-09-09",
          dayScore: 90,
          verdict: "Good",
        })
      ).rejects.toThrowError(/Failed to query database for duplicates.*Notion service failure/);

      // Assert it NEVER proceeded to create a page
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("aborts sync and preserves Retry-After header when query is rate-limited (HTTP 429)", async () => {
      const fetchMock = vi.spyOn(global, "fetch");

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => validDbSchema,
      } as Response);

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "45" }),
        json: async () => ({ code: "rate_limited", message: "Rate limit hit" }),
      } as any);

      await expect(
        syncDiaryEntry("key", "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d", {
          date: "2026-09-09",
          dayScore: 90,
          verdict: "Good",
        })
      ).rejects.toMatchObject({
        status: 429,
        message: expect.stringMatching(/Retry after 45 seconds/),
      });
    });

    it("aborts sync immediately on network connection failure during query", async () => {
      const fetchMock = vi.spyOn(global, "fetch");

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => validDbSchema,
      } as Response);

      // Network drop
      fetchMock.mockRejectedValueOnce(new Error("ECONNRESET: Connection reset by peer"));

      await expect(
        syncDiaryEntry("key", "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d", {
          date: "2026-09-09",
          dayScore: 90,
          verdict: "Good",
        })
      ).rejects.toMatchObject({
        status: 502,
        message: expect.stringMatching(/Network error during duplicate check/),
      });
    });

    it("aborts sync if query response is malformed", async () => {
      const fetchMock = vi.spyOn(global, "fetch");

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => validDbSchema,
      } as Response);

      // Malformed response (no results array)
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ unexpected: "payload" }),
      } as Response);

      await expect(
        syncDiaryEntry("key", "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d", {
          date: "2026-09-09",
          dayScore: 90,
          verdict: "Good",
        })
      ).rejects.toMatchObject({
        status: 502,
        message: expect.stringMatching(/Malformed query response/),
      });
    });

    it("detects multiple existing matches and reports a 409 conflict instead of updating first", async () => {
      const fetchMock = vi.spyOn(global, "fetch");

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => validDbSchema,
      } as Response);

      // 2 existing pages found!
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          results: [
            { id: "page-1", url: "https://notion.so/page-1" },
            { id: "page-2", url: "https://notion.so/page-2" },
          ],
        }),
      } as Response);

      await expect(
        syncDiaryEntry("key", "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d", {
          date: "2026-09-09",
          dayScore: 90,
          verdict: "Good",
        })
      ).rejects.toMatchObject({
        status: 409,
        message: expect.stringMatching(/Duplicate conflict: Found 2 existing Notion pages/),
      });
    });
  });

  describe("6. Concurrency Control and Mutex Lock", () => {
    it("queues concurrent sync requests for the same date sequentially", async () => {
      const fetchMock = vi.spyOn(global, "fetch");

      const validDbSchema = {
        properties: {
          Name: { type: "title" },
          Date: { type: "date" },
          Score: { type: "number" },
          Verdict: { type: "select" },
        },
      };

      // Call 1: schema, query (0 results), create page
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => validDbSchema } as Response);
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) } as Response);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "page-created-1", url: "https://notion.so/page-created-1" }),
      } as Response);

      // Call 2: schema, query (sees 1 result now!), patch page
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => validDbSchema } as Response);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: "page-created-1", url: "https://notion.so/page-created-1" }] }),
      } as Response);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "page-created-1", url: "https://notion.so/page-created-1" }),
      } as Response);

      // Launch both concurrently
      const [res1, res2] = await Promise.all([
        syncDiaryEntry("key", "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d", {
          date: "2026-09-09",
          dayScore: 85,
          verdict: "Good",
        }),
        syncDiaryEntry("key", "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d", {
          date: "2026-09-09",
          dayScore: 90,
          verdict: "Great",
        }),
      ]);

      expect(res1.updated).toBe(false); // First one created
      expect(res2.updated).toBe(true); // Second one updated existing, preventing duplicate!
    });
  });

  describe("7. Supertest HTTP Endpoint Integration (/api/notion/sync)", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const res = await request(app).post("/api/notion/sync").send({ action: "test" });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Missing Firebase ID token/);
    });

    it("rejects client attempts to override credentials with 400", async () => {
      const res = await request(app)
        .post("/api/notion/sync")
        .set("Authorization", "Bearer valid-token")
        .send({ action: "test", apiKey: "forbidden_override" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Client-supplied Notion credentials or destination overrides are forbidden/);
    });

    it("rejects unauthorized users with 403 Forbidden using real verifyOwnerAuth flow", async () => {
      mockVerifyIdToken.mockResolvedValueOnce({
        uid: "not-admin-user",
        email: "guest@example.com",
      });

      const res = await request(app)
        .post("/api/notion/sync")
        .set("Authorization", "Bearer token-for-non-admin")
        .send({ action: "test" });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden: User is not authorized/);
    });

    it("accepts authorized admin and performs test connection", async () => {
      mockVerifyIdToken.mockResolvedValueOnce({
        uid: "test-admin-owner-uid-999",
        email: "owner@example.com",
      });

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
        .set("Authorization", "Bearer valid-owner-token")
        .send({ action: "test" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.readyToSync).toBe(true);
      expect(res.body.databaseTitle).toBe("Manhattan Tracker");
    });
  });

  describe("8. Vercel Serverless Entrypoint (api/index.ts)", () => {
    it("imports Vercel serverless entrypoint without throwing ERR_UNSUPPORTED_DIR_IMPORT", async () => {
      const vercelModule = await import("../api/index.js");
      expect(vercelModule.default).toBeDefined();
      expect(vercelModule.default).toBe(app);
    });

    it("handles /api/health through the Vercel entrypoint app", async () => {
      const vercelModule = await import("../api/index.js");
      const vercelApp = vercelModule.default;
      const res = await request(vercelApp).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });

    it("transpiles Vercel API graph to JS and boots emitted api/index.js in pure Node ESM with VERCEL=1", async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vercel-esm-smoke-"));
      try {
        fs.symlinkSync(path.resolve("node_modules"), path.join(tmpDir, "node_modules"), "junction");
        fs.writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify({ type: "module" }));

        // Transpile the serverless dependency graph without Vitest's TS resolver
        await esbuild.build({
          entryPoints: [
            "api/index.ts",
            "server.ts",
            "server/firebaseAdmin.ts",
            "server/notionService.ts",
          ],
          outdir: tmpDir,
          format: "esm",
          platform: "node",
          packages: "external",
          bundle: false,
        });

        // Ensure emitted files exist as .js
        expect(fs.existsSync(path.join(tmpDir, "api/index.js"))).toBe(true);
        expect(fs.existsSync(path.join(tmpDir, "server.js"))).toBe(true);
        expect(fs.existsSync(path.join(tmpDir, "server/firebaseAdmin.js"))).toBe(true);
        expect(fs.existsSync(path.join(tmpDir, "server/notionService.js"))).toBe(true);

        // Run pure Node ESM child process with VERCEL=1 (no TS runtime / loader)
        const script = `
          import app from "./api/index.js";
          import http from "node:http";

          const server = http.createServer(app);
          server.listen(0, "127.0.0.1", () => {
            const port = server.address().port;
            http.get(\`http://127.0.0.1:\${port}/api/health\`, (res) => {
              let body = "";
              res.on("data", chunk => body += chunk);
              res.on("end", () => {
                server.close();
                process.stdout.write("__PAYLOAD__" + JSON.stringify({ statusCode: res.statusCode, body: JSON.parse(body) }));
                process.exit(0);
              });
            }).on("error", (err) => {
              server.close();
              process.stderr.write(err.message);
              process.exit(1);
            });
          });
        `;

        const rawOutput = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
          cwd: tmpDir,
          env: {
            ...process.env,
            VERCEL: "1",
            NODE_ENV: "production",
          },
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        });

        const match = rawOutput.match(/__PAYLOAD__(.+)/);
        expect(match).not.toBeNull();
        const result = JSON.parse(match![1]);
        expect(result.statusCode).toBe(200);
        expect(result.body.status).toBe("ok");
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it("verifies pure Node ESM fails with ERR_MODULE_NOT_FOUND when emitted JS imports a .ts specifier", async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vercel-esm-failure-check-"));
      try {
        fs.symlinkSync(path.resolve("node_modules"), path.join(tmpDir, "node_modules"), "junction");
        fs.writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify({ type: "module" }));
        fs.mkdirSync(path.join(tmpDir, "api"));

        // Simulate incorrect emitted file importing .ts
        fs.writeFileSync(path.join(tmpDir, "api/index.js"), 'import app from "../server.ts"; export default app;');
        fs.writeFileSync(path.join(tmpDir, "server.js"), "export default {};");

        let thrownError = "";
        try {
          execFileSync(process.execPath, ["--input-type=module", "-e", 'import app from "./api/index.js";'], {
            cwd: tmpDir,
            env: { ...process.env, VERCEL: "1", NODE_ENV: "production" },
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
          });
        } catch (err: unknown) {
          const execError = err as { stderr?: string; message?: string };
          thrownError = (execError.stderr || "") + (execError.message || "");
        }

        expect(thrownError).toContain("ERR_MODULE_NOT_FOUND");
        expect(thrownError).toContain("server.ts");
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
