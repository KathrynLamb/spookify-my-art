// // src/lib/firebaseAdminApp.ts
// import "server-only";
// import {
//   cert, getApps, getApp, initializeApp, type App
// } from "firebase-admin/app";

// type SA = { project_id?: string; client_email?: string; private_key?: string };

// function normalizeKey(k: string) {
//   return k
//     .replace(/\r\n/g, "\n")
//     .replace(/\\n/g, "\n")
//     .replace(/-----BEGIN PRIVATE KEY-----\s*/m, "-----BEGIN PRIVATE KEY-----\n")
//     .replace(/\s*-----END PRIVATE KEY-----\s*$/m, "\n-----END PRIVATE KEY-----\n")
//     .trim();
// }

// function loadCreds() {
//   const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

//   let projectId   = process.env.FIREBASE_PROJECT_ID   ?? "";
//   let clientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? "";
//   let privateKey  = process.env.FIREBASE_PRIVATE_KEY  ?? "";

//   if ((!projectId || !clientEmail || !privateKey) && raw) {
//     try {
//       const j = JSON.parse(raw) as SA;
//       projectId   ||= j.project_id   ?? "";
//       clientEmail ||= j.client_email ?? "";
//       privateKey  ||= j.private_key  ?? "";
//     } catch {}
//   }

//   if (privateKey) privateKey = normalizeKey(privateKey);
//   return { projectId, clientEmail, privateKey };
// }

// export function getAdminApp(): App {
//   const apps = getApps();
//   if (apps.length) return getApp();

//   const { projectId, clientEmail, privateKey } = loadCreds();

//   return initializeApp({
//     credential: cert({
//       projectId,
//       clientEmail,
//       privateKey,
//     }),
//     projectId,
//   });
// }
// src/lib/firebase/admin.ts
import "server-only";

// import { getAdminApp } from "./firebaseAdminApp";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAdminApp } from "../firebaseAdminApp";

/**
 * Initialize the Firebase Admin App (idempotent).
 */
const app = getAdminApp();

/**
 * Export Firestore (admin)
 * Used as: adminDb.collection(...)
 */
export const adminDb = getFirestore(app);

/**
 * Export Storage (admin)
 * Used for server-side uploads to Firebase Storage
 */
export const adminStorage = getStorage(app);
