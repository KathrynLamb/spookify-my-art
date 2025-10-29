// src/lib/firebase/admin.ts
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type SAJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function loadCreds() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
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
      console.warn("[firebase-admin] Could not parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:", e);
    }
  }

  // Vercel/ENV newlines come escaped
  if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

  return { projectId, clientEmail, privateKey };
}

let app: App;
if (!getApps().length) {
  const { projectId, clientEmail, privateKey } = loadCreds();

  if (!projectId || !clientEmail || !privateKey) {
    // Fail clearly with what’s missing
    const missing = [
      !projectId && "projectId",
      !clientEmail && "clientEmail",
      !privateKey && "privateKey",
    ].filter(Boolean);
    throw new Error(
      `[firebase-admin] Missing Firebase admin credentials: ${missing.join(
        ", "
      )}. Provide FIREBASE_SERVICE_ACCOUNT_KEY (full JSON, one line) or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.`
    );
  }

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
} else {
  app = getApps()[0]!;
}

export const adminDb = getFirestore(app);
