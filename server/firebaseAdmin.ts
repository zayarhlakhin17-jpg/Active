import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";
import path from "path";
import fs from "fs";

let adminApp: App | null = null;

export function getFirebaseAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }
  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    adminApp = existingApps[0];
    return adminApp;
  }

  let projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  if (!projectId) {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        projectId = raw.projectId;
      }
    } catch {
      // fallback
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminApp = initializeApp({
        credential: cert(creds),
        projectId: creds.project_id || projectId,
      });
      return adminApp;
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
    }
  }

  adminApp = initializeApp({
    projectId: projectId || "gen-lang-client-0780894703",
  });
  return adminApp;
}

export async function verifyOwnerAuth(idToken: string | undefined | null): Promise<DecodedIdToken> {
  if (!idToken || typeof idToken !== "string" || idToken.trim() === "") {
    const error: any = new Error("Authentication required: Missing Firebase ID token.");
    error.status = 401;
    throw error;
  }

  const expectedAdminUid = process.env.ADMIN_FIREBASE_UID;
  if (!expectedAdminUid) {
    const error: any = new Error("Server configuration error: ADMIN_FIREBASE_UID is not configured.");
    error.status = 500;
    throw error;
  }

  const app = getFirebaseAdminApp();
  let decoded: DecodedIdToken;

  try {
    const auth = getAuth(app);
    decoded = await auth.verifyIdToken(idToken.trim());
  } catch (err: any) {
    const error: any = new Error(`Authentication failed: ${err.message || "Invalid or expired Firebase ID token"}`);
    error.status = 401;
    throw error;
  }

  if (decoded.uid !== expectedAdminUid) {
    const error: any = new Error("Forbidden: User is not authorized to access Notion integration.");
    error.status = 403;
    throw error;
  }

  return decoded;
}
