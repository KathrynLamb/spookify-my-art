// src/lib/firebaseAdminApp.ts
import "server-only";
import { cert, getApps, getApp, initializeApp, type App } from "firebase-admin/app";

// Load service account values safely
function loadAdminCreds() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "[firebase-admin] Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY"
    );
  }

  // Fix escaped newlines
  privateKey = privateKey.replace(/\\n/g, "\n");

  return { projectId, clientEmail, privateKey };
}

export function getAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) return getApp();

  const { projectId, clientEmail, privateKey } = loadAdminCreds();

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // e.g. ai-gifts.appspot.com
  });
}
