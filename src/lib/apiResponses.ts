import { NextResponse } from "next/server";

type HeaderMap = Record<string, string>;

function mergeHeaders(base?: HeaderMap, extra?: HeaderMap): HeaderMap | undefined {
  if (!base && !extra) return undefined;
  return {
    ...(base || {}),
    ...(extra || {}),
  };
}

export function jsonOk(payload: unknown, headers?: HeaderMap) {
  return NextResponse.json(payload, {
    headers,
  });
}

export function jsonError(message: string, status = 500, headers?: HeaderMap) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers,
    }
  );
}

export function jsonRateLimited(retryAfterSeconds: number) {
  const retryAfter = Math.max(1, Math.floor(retryAfterSeconds || 1));
  return jsonError(`Too many requests. Retry in ${retryAfter}s.`, 429, {
    "Retry-After": String(retryAfter),
  });
}

export function jsonUnauthorized() {
  return jsonError("Unauthorized", 401);
}

export function jsonBadRequest(message: string) {
  return jsonError(message, 400);
}

export function jsonForbidden(message: string) {
  return jsonError(message, 403);
}

export function jsonNotFound(message: string) {
  return jsonError(message, 404);
}

export function withNoStore(headers?: HeaderMap): HeaderMap {
  return mergeHeaders(headers, { "Cache-Control": "private, no-store" }) || { "Cache-Control": "private, no-store" };
}