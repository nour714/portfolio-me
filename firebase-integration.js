import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAnalytics,
  isSupported as analyticsIsSupported
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAp5jwXJ_rL_IBtzNEnaazkYp2cm0gQtew",
  authDomain: "nour-b174b.firebaseapp.com",
  projectId: "nour-b174b",
  storageBucket: "nour-b174b.firebasestorage.app",
  messagingSenderId: "231185741090",
  appId: "1:231185741090:web:1d1b3f0d92b8730bdae17b",
  measurementId: "G-N91B5WTMWJ"
};

const TRUSTED_ADMIN_EMAILS = new Set([
  "noureg122@gmail.com"
]);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});

analyticsIsSupported()
  .then((supported) => {
    if (supported) getAnalytics(app);
  })
  .catch(() => {});

function sanitizeStoragePathSegment(value) {
  return String(value || "file")
    .toLowerCase()
    .replace(/[^a-z0-9._/-]+/g, "-")
    .replace(/\/{2,}/g, "/")
    .replace(/-+/g, "-")
    .replace(/^[-/.]+|[-/.]+$/g, "") || "file";
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getCurrentUserEmail() {
  return normalizeEmail(auth.currentUser?.email);
}

function isTrustedAdminUser() {
  const user = auth.currentUser;
  return Boolean(user && TRUSTED_ADMIN_EMAILS.has(getCurrentUserEmail()));
}

function ensureTrustedAdminUser() {
  if (!auth.currentUser) {
    throw new Error("Not authenticated - sign in first.");
  }

  if (!isTrustedAdminUser()) {
    throw new Error("This account is not allowed to access admin actions.");
  }
}

function sanitizeMessagePayload(message = {}) {
  return {
    name: String(message.name || "").trim(),
    email: String(message.email || "").trim(),
    projectType: String(message.projectType || "").trim(),
    message: String(message.message || "").trim()
  };
}

function isFirestorePermissionError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("missing or insufficient permissions") ||
    message.includes("permission-denied")
  );
}

function wrapFirestorePermissionError(error, actionLabel) {
  if (!isFirestorePermissionError(error)) {
    throw error;
  }

  throw new Error(
    `${actionLabel} blocked by Firestore rules. Publish the updated firestore.rules to project nour-b174b, then try again.`
  );
}

async function uploadPortfolioImageToStorage(file, folder = "projects") {
  if (!(file instanceof File)) {
    throw new Error("A valid image file is required.");
  }

  ensureTrustedAdminUser();

  const safeFolder = sanitizeStoragePathSegment(folder);
  const safeName = sanitizeStoragePathSegment(file.name || `image-${Date.now()}`);
  const imageRef = storageRef(storage, `portfolio/${safeFolder}/${Date.now()}-${safeName}`);

  await uploadBytes(imageRef, file, {
    contentType: file.type || "application/octet-stream",
    cacheControl: "public,max-age=31536000,immutable"
  });

  return getDownloadURL(imageRef);
}

async function getIdToken(forceRefresh = false) {
  if (!auth.currentUser) return null;

  try {
    return await auth.currentUser.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

function serializeFirestoreValue(value) {
  if (value && typeof value.toDate === "function") {
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

function isRecoverableApiError(error) {
  const message = String(error?.message || "");
  return (
    message.includes("Failed to fetch") ||
    message.includes("non-JSON response") ||
    message.includes("unexpected portfolio payload") ||
    message.includes("unexpected messages payload") ||
    message.includes("status 404") ||
    message.includes("status 405") ||
    message.includes("status 500") ||
    message.includes("status 502") ||
    message.includes("status 503") ||
    message.includes("status 504") ||
    message.includes("Invalid or expired admin token.") ||
    message.includes("Admin token expired.") ||
    message.includes("Server Firebase Admin is not configured.")
  );
}

async function savePortfolioDataSdk(data) {
  ensureTrustedAdminUser();

  try {
    await setDoc(doc(db, "portfolio", "content"), data, { merge: true });
    return data;
  } catch (error) {
    wrapFirestorePermissionError(error, "Save");
  }
}

async function loadPortfolioDataSdk() {
  const snapshot = await getDoc(doc(db, "portfolio", "content"));
  return snapshot.exists() ? serializeFirestoreValue(snapshot.data()) : null;
}

async function listMessagesSdk() {
  ensureTrustedAdminUser();

  try {
    const snapshot = await getDocs(collection(db, "messages"));
    return snapshot.docs
      .map((messageDoc) => ({
        _id: messageDoc.id,
        ...serializeFirestoreValue(messageDoc.data())
      }))
      .sort((left, right) => {
        const leftTime = Date.parse(left.createdAt || "") || 0;
        const rightTime = Date.parse(right.createdAt || "") || 0;
        return rightTime - leftTime;
      });
  } catch (error) {
    wrapFirestorePermissionError(error, "Loading messages");
  }
}

async function deleteMessageSdk(docId) {
  ensureTrustedAdminUser();

  try {
    await deleteDoc(doc(db, "messages", docId));
  } catch (error) {
    wrapFirestorePermissionError(error, "Deleting messages");
  }
}

async function saveContactMessageSdk(message) {
  const payload = sanitizeMessagePayload(message);

  try {
    await addDoc(collection(db, "messages"), {
      ...payload,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    wrapFirestorePermissionError(error, "Sending messages");
  }
}

function buildApiError(response, payload) {
  const error = new Error(payload?.error || `Request failed with status ${response.status}.`);
  error.statusCode = response.status;
  error.payload = payload;
  return error;
}

async function performApiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    requireAuth = false,
    forceRefreshToken = false
  } = options;

  const headers = new Headers({
    Accept: "application/json"
  });

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (requireAuth) {
    const token = await getIdToken(forceRefreshToken);

    if (!token) {
      throw new Error("Not authenticated - sign in first.");
    }

    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: method === "GET" ? "no-store" : "default"
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  const isApiRoute = String(path || "").startsWith("/api/");

  if (isApiRoute && !contentType.includes("application/json")) {
    throw new Error("API returned non-JSON response.");
  }

  const payload = contentType.includes("application/json")
    ? await response.json()
    : { error: await response.text() };

  if (!response.ok) {
    throw buildApiError(response, payload);
  }

  return payload;
}

async function apiRequest(path, options = {}) {
  try {
    return await performApiRequest(path, options);
  } catch (error) {
    if (!options?.requireAuth || Number(error?.statusCode) !== 401) {
      throw error;
    }

    return performApiRequest(path, {
      ...options,
      forceRefreshToken: true
    });
  }
}

window.FirebaseAdminAPI = {
  login: (email, password) => signInWithEmailAndPassword(auth, email, password),

  logout: () => signOut(auth),

  onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),

  savePortfolioData: async (data) => {
    try {
      const payload = await apiRequest("/api/portfolio", {
        method: "PATCH",
        body: data,
        requireAuth: true
      });

      return payload?.data || null;
    } catch (error) {
      if (!isRecoverableApiError(error)) {
        throw error;
      }

      console.warn("[API] savePortfolioData fallback to Firestore SDK:", error);
      return savePortfolioDataSdk(data);
    }
  },

  loadPortfolioData: async () => {
    try {
      const payload = await apiRequest("/api/portfolio");
      if (!payload || !Object.prototype.hasOwnProperty.call(payload, "data")) {
        throw new Error("API returned unexpected portfolio payload.");
      }
      return payload?.data || null;
    } catch (error) {
      if (!isRecoverableApiError(error)) {
        throw error;
      }

      console.warn("[API] loadPortfolioData fallback to Firestore SDK:", error);
      return loadPortfolioDataSdk();
    }
  },

  onPortfolioUpdate: (callback) => {
    let stopped = false;

    const poll = async () => {
      if (stopped) return;

      try {
        const data = await window.FirebaseAdminAPI.loadPortfolioData();
        if (data) callback(data);
      } catch (error) {
        console.warn("[API] Portfolio polling failed:", error);
      }

      if (!stopped) {
        setTimeout(poll, 30_000);
      }
    };

    poll();

    return () => {
      stopped = true;
    };
  },

  listMessages: async () => {
    try {
      const payload = await apiRequest("/api/messages", {
        requireAuth: true
      });
      if (!payload || !Array.isArray(payload?.data)) {
        throw new Error("API returned unexpected messages payload.");
      }

      return Array.isArray(payload?.data) ? payload.data : [];
    } catch (error) {
      if (!isRecoverableApiError(error)) {
        throw error;
      }

      console.warn("[API] listMessages fallback to Firestore SDK:", error);
      return listMessagesSdk();
    }
  },

  deleteMessage: async (docId) => {
    if (!docId) {
      throw new Error("deleteMessage: docId is required.");
    }

    try {
      await apiRequest(`/api/messages?id=${encodeURIComponent(docId)}`, {
        method: "DELETE",
        requireAuth: true
      });
    } catch (error) {
      if (!isRecoverableApiError(error)) {
        throw error;
      }

      console.warn("[API] deleteMessage fallback to Firestore SDK:", error);
      await deleteMessageSdk(docId);
    }
  },

  uploadPortfolioImage: async (file, folder = "projects") => {
    return uploadPortfolioImageToStorage(file, folder);
  }
};

window.__firebaseReady = true;
window.dispatchEvent(new CustomEvent("firebase-ready"));

document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contact-form");
  const submitBtn = contactForm?.querySelector("button[type='submit']");
  const statusNote = document.getElementById("contact-status-note");

  if (!contactForm || !submitBtn || !statusNote) return;

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const honeypot = String(formData.get("website") || "").trim();
    const message = {
      name: formData.get("name") || "",
      email: formData.get("email") || "",
      projectType: formData.get("project_type") || "",
      message: formData.get("message") || ""
    };

    if (honeypot) {
      statusNote.textContent = "Unable to send message right now.";
      statusNote.style.color = "#F44336";
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.7";
    submitBtn.style.cursor = "not-allowed";

    try {
      try {
        await apiRequest("/api/messages", {
          method: "POST",
          body: message
        });
      } catch (error) {
        if (!isRecoverableApiError(error)) {
          throw error;
        }

        console.warn("[API] contact form fallback to Firestore SDK:", error);
        await saveContactMessageSdk(message);
      }

      statusNote.textContent = "Message sent successfully. I will reply soon.";
      statusNote.style.color = "#4CAF50";
      contactForm.reset();
    } catch (error) {
      console.error("[API] Error saving message:", error);
      statusNote.textContent = error.message || "Failed to send. Please email me directly.";
      statusNote.style.color = "#F44336";
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";

      setTimeout(() => {
        statusNote.textContent = "Your message will be sent securely to my inbox.";
        statusNote.style.color = "var(--text-soft, inherit)";
      }, 6000);
    }
  });
});
