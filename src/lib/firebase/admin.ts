// src/lib/firebase/admin.ts
import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type SAJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function loadCreds() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY; // one-line JSON string
  let projectId = process.env.FIREBASE_PROJECT_ID || "";
  let clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "";
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as SAJson;
      projectId ||= parsed.project_id || "";
      clientEmail ||= parsed.client_email || "";
      privateKey ||= parsed.private_key || "";
    } catch (e) {
      console.warn(
        "[firebase-admin] Could not parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:",
        e
      );
    }
  }

  if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

  return { projectId, clientEmail, privateKey };
}

let adminApp: App | undefined;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const { projectId, clientEmail, privateKey } = loadCreds();
  if (!projectId || !clientEmail || !privateKey) {
    const missing = [
      !projectId && "projectId",
      !clientEmail && "clientEmail",
      !privateKey && "privateKey",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `[firebase-admin] Missing Firebase admin credentials: ${missing}. ` +
        `Provide FIREBASE_SERVICE_ACCOUNT_KEY (full JSON, one line) or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.`
    );
  }

  adminApp = getApps().length
    ? (getApps()[0] as App)
    : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
  return adminApp;
}

export const adminDb = getFirestore(getAdminApp());
