import {
  adminDb,
  normalizeMessagePayload,
  requireAdminUser,
  serializeFirestoreValue
} from "../server/firebase-admin.mjs";
import { errorResponse, jsonResponse, readJson } from "../server/http.mjs";

function messagesCollection() {
  return adminDb().collection("messages");
}

function sortMessagesByDate(messages) {
  return [...messages].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt || "") || 0;
    const rightTime = Date.parse(right.createdAt || "") || 0;
    return rightTime - leftTime;
  });
}

export async function GET(request) {
  const authResult = await requireAdminUser(request);

  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const snapshot = await messagesCollection().get();
    const messages = sortMessagesByDate(
      snapshot.docs.map((doc) => ({
        _id: doc.id,
        ...serializeFirestoreValue(doc.data())
      }))
    );

    return jsonResponse({ data: messages });
  } catch (error) {
    console.error("[API] Failed to list messages:", error);
    return errorResponse("Failed to load messages.", 500);
  }
}

export async function POST(request) {
  let payload;

  try {
    payload = normalizeMessagePayload(await readJson(request));
  } catch (error) {
    return errorResponse(error.message, 400);
  }

  try {
    const docRef = await messagesCollection().add(payload);

    return jsonResponse(
      {
        ok: true,
        id: docRef.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Failed to create message:", error);
    return errorResponse("Failed to save message.", 500);
  }
}

export async function DELETE(request) {
  const authResult = await requireAdminUser(request);

  if (!authResult.ok) {
    return authResult.response;
  }

  const url = new URL(request.url);
  const messageId = String(url.searchParams.get("id") || "").trim();

  if (!messageId) {
    return errorResponse("Message id is required.", 400);
  }

  try {
    await messagesCollection().doc(messageId).delete();
    return new Response(null, {
      status: 204,
      headers: {
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    console.error("[API] Failed to delete message:", error);
    return errorResponse("Failed to delete message.", 500);
  }
}
