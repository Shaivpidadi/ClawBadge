import type { Context } from "hono";

import { ClawBadgeError } from "./errors.js";

export const SVG_CACHE_CONTROL = "public, max-age=300, s-maxage=300, stale-while-revalidate=3600";
export const JSON_CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=600";

export function setSvgHeaders(context: Context, source?: string): void {
  context.header("Content-Type", "image/svg+xml; charset=utf-8");
  context.header("Cache-Control", SVG_CACHE_CONTROL);
  context.header("X-Content-Type-Options", "nosniff");

  if (source) {
    context.header("X-ClawBadge-Source", source);
  }
}

export function setJsonHeaders(context: Context, source?: string): void {
  context.header("Cache-Control", JSON_CACHE_CONTROL);
  context.header("X-Content-Type-Options", "nosniff");

  if (source) {
    context.header("X-ClawBadge-Source", source);
  }
}

export function setHtmlHeaders(context: Context): void {
  context.header("Content-Type", "text/html; charset=utf-8");
  context.header("Cache-Control", "no-store");
  context.header("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'");
  context.header("X-Content-Type-Options", "nosniff");
}

export function normalizeError(error: unknown): ClawBadgeError {
  if (error instanceof ClawBadgeError) {
    return error;
  }

  return new ClawBadgeError("Unexpected server error.", "internal_error", 500, false);
}
