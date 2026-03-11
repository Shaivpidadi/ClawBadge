export class ClawBadgeError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statusCode: number,
    readonly expose = true
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends ClawBadgeError {
  constructor(message = "Invalid skill slug.") {
    super(message, "invalid_slug", 400);
  }
}

export class NotFoundError extends ClawBadgeError {
  constructor(message = "Skill not found.") {
    super(message, "skill_not_found", 404);
  }
}

export class UpstreamError extends ClawBadgeError {
  constructor(message = "ClawHub is unavailable.", code = "upstream_unavailable", statusCode = 503) {
    super(message, code, statusCode, false);
  }
}

export class UpstreamPayloadError extends ClawBadgeError {
  constructor(message = "ClawHub returned an invalid payload.") {
    super(message, "upstream_invalid_payload", 502, false);
  }
}

export class RateLimitError extends ClawBadgeError {
  constructor(readonly retryAfterSeconds: number) {
    super("Rate limit exceeded.", "rate_limited", 429);
  }
}

export function isRecoverableUpstreamError(error: unknown): boolean {
  return error instanceof UpstreamError || error instanceof UpstreamPayloadError;
}
