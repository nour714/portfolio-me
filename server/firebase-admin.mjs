import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { Timestamp, getFirestore } from "firebase-admin/firestore";

import { errorResponse } from "./http.mjs";

const DEFAULT_ADMIN_EMAILS = [
  "noureg122@gmail.com"
];

const adminEmails = new Set(
  [
    ...DEFAULT_ADMIN_EMAILS,
    ...String(process.env.FIREBASE_ADMIN_EMAILS || "")
      .split(",")
  ]
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

const adminUids = new Set(
  String(process.env.FIREBASE_ADMIN_UIDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

function requiredEnv(name) {
  const value = process.env[name];

  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return String(value).trim();
}

function getPrivateKey() {
  return requiredEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n");
}

function getFirebaseAdminApp() {
  if (getApps().length) {
    return getApp();
  }

  return initializeApp({
    credential: cert({
      projectId: requiredEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requiredEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: getPrivateKey()
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined
  });
}

export function adminDb() {
  return getFirestore(getFirebaseAdminApp());
}

function adminAuth() {
  return getAuth(getFirebaseAdminApp());
}

function getBearerToken(request) {
  const header = request.headers.get("authorization") || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
}

function isAllowedAdmin(decodedToken) {
  const email = String(decodedToken.email || "").trim().toLowerCase();

  if (adminUids.size && adminUids.has(decodedToken.uid)) {
    return true;
  }

  if (adminEmails.size && email && adminEmails.has(email)) {
    return true;
  }

  if (adminUids.size || adminEmails.size) {
    return Boolean(email && adminEmails.has(email));
  }
  return false;
}

export async function requireAdminUser(request) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      response: errorResponse("Missing admin token.", 401)
    };
  }

  try {
    const decodedToken = await adminAuth().verifyIdToken(token);

    if (!isAllowedAdmin(decodedToken)) {
      return {
        ok: false,
        response: errorResponse("You are not allowed to use this admin API.", 403)
      };
    }

    return {
      ok: true,
      user: decodedToken
    };
  } catch (error) {
    console.error("[API] Admin token verification failed:", error);
    return {
      ok: false,
      response: errorResponse("Invalid or expired admin token.", 401)
    };
  }
}

export function serializeFirestoreValue(value) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeFirestoreValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serializeFirestoreValue(nestedValue)])
    );
  }

  return value;
}

function clampText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeMessagePayload(rawPayload = {}) {
  if (String(rawPayload.website || "").trim()) {
    throw new Error("Message rejected.");
  }

  const payload = {
    name: clampText(rawPayload.name, 120),
    email: clampText(rawPayload.email, 200),
    projectType: clampText(rawPayload.projectType, 120),
    message: clampText(rawPayload.message, 4000),
    createdAt: new Date().toISOString()
  };

  if (!payload.name) {
    throw new Error("Name is required.");
  }

  if (!payload.email || !isValidEmail(payload.email)) {
    throw new Error("A valid email is required.");
  }

  if (!payload.message) {
    throw new Error("Message is required.");
  }

  return payload;
}
