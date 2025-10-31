import "server-only";
import { cert, getApps, getApp, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type SA = { project_id?: string; client_email?: string; private_key?: string };

function normalizeKey(k: string) {
  return k
    .replace(/\r\n/g, "\n")                       // CRLF → LF
    .replace(/\\n/g, "\n")                        // unescape \n from env vars
    .replace(/-----BEGIN PRIVATE KEY-----\s*/m, "-----BEGIN PRIVATE KEY-----\n")
    .replace(/\s*-----END PRIVATE KEY-----\s*$/m, "\n-----END PRIVATE KEY-----\n")
    .trim();
}

function loadCreds() {
  // Prefer explicit vars; fall back to one-line JSON var
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  let projectId   = process.env.FIREBASE_PROJECT_ID   ?? "";
  let clientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? "";
  let privateKey  = process.env.FIREBASE_PRIVATE_KEY  ?? "";

  if ((!projectId || !clientEmail || !privateKey) && raw) {
    try {
      const j = JSON.parse(raw) as SA;
      projectId   ||= j.project_id   ?? "";
      clientEmail ||= j.client_email ?? "";
      privateKey  ||= j.private_key  ?? "";
    } catch (e) {
      console.warn("[firebase-admin] Could not parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
    }
  }

  if (privateKey) privateKey = normalizeKey(privateKey);
  return { projectId, clientEmail, privateKey };
}

function getAdminApp(): App {
  const apps = getApps();
  if (apps.length) return getApp();

  const { projectId, clientEmail, privateKey } = loadCreds();
  if (!projectId || !clientEmail || !privateKey) {
    const missing = [
      !projectId && "projectId",
      !clientEmail && "clientEmail",
      !privateKey && "privateKey",
    ].filter(Boolean).join(", ");
    throw new Error(
      `[firebase-admin] Missing Firebase admin credentials: ${missing}. ` +
      `Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (escaped \\n), ` +
      `or provide FIREBASE_SERVICE_ACCOUNT_KEY as one-line JSON.`,
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
}

export const adminDb = getFirestore(getAdminApp());
