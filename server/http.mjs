const DEFAULT_HEADERS = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8"
};

export function jsonResponse(payload, init = {}) {
  const headers = new Headers(DEFAULT_HEADERS);

  if (init.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }

  return new Response(JSON.stringify(payload), {
    ...init,
    headers
  });
}

export function errorResponse(message, status = 500, extra = {}) {
  return jsonResponse(
    {
      error: message,
      ...extra
    },
    { status }
  );
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new Error("Invalid JSON body.");
  }
}
