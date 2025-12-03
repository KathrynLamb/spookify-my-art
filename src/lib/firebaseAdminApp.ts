import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: App | null = null;

/**
 * Returns a singleton Firebase Admin app instance.
 */
export function getAdminApp(): App {
  if (!app) {
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
const privateKey = rawKey
  ?.replace(/\\n/g, "\n")
  ?.replace(/\\\\n/g, "\n")
  ?.replace(/"'/g, "")      // remove rogue quotes if any
  ?.trim();


    if (!privateKey) {
      console.error("❌ FIREBASE_PRIVATE_KEY is missing in env!");
    }
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.error("❌ FIREBASE_PROJECT_ID is missing in env!");
    }
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      console.error("❌ FIREBASE_CLIENT_EMAIL is missing in env!");
    }

    // Reuse existing app if already initialized
    if (getApps().length > 0) {
      app = getApps()[0]!;
    } else {
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });

      console.log("🔥 Firebase Admin initialized");
    }
  }

  return app;
}

export const adminDb: Firestore = getFirestore(getAdminApp());
