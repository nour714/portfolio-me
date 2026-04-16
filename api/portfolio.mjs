import { adminDb, requireAdminUser, serializeFirestoreValue } from "../server/firebase-admin.mjs";
import { errorResponse, jsonResponse, readJson } from "../server/http.mjs";

function portfolioDoc() {
  return adminDb().collection("portfolio").doc("content");
}

export async function GET() {
  try {
    const snapshot = await portfolioDoc().get();

    return jsonResponse({
      data: snapshot.exists ? serializeFirestoreValue(snapshot.data()) : null
    });
  } catch (error) {
    console.error("[API] Failed to load portfolio data:", error);
    return errorResponse("Failed to load portfolio data.", 500);
  }
}

export async function PATCH(request) {
  const authResult = await requireAdminUser(request);

  if (!authResult.ok) {
    return authResult.response;
  }

  let payload;

  try {
    payload = await readJson(request);
  } catch (error) {
    return errorResponse(error.message, 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return errorResponse("Portfolio payload must be an object.", 400);
  }

  try {
    await portfolioDoc().set(payload, { merge: true });
    const snapshot = await portfolioDoc().get();

    return jsonResponse({
      ok: true,
      data: snapshot.exists ? serializeFirestoreValue(snapshot.data()) : null
    });
  } catch (error) {
    console.error("[API] Failed to save portfolio data:", error);
    return errorResponse("Failed to save portfolio data.", 500);
  }
}
