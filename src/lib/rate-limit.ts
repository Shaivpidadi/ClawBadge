import type { RateLimitError } from "./errors.js";

export type RateLimitScope = "badge" | "api" | "page";

type RateLimitRule = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const defaultRules: Record<RateLimitScope, RateLimitRule> = {
  badge: { limit: 60, windowMs: 60_000 },
  api: { limit: 30, windowMs: 60_000 },
  page: { limit: 20, windowMs: 60_000 }
};

export class MemoryRateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(
    private readonly enabled: boolean,
    private readonly rules: Record<RateLimitScope, RateLimitRule> = defaultRules
  ) {}

  check(scope: RateLimitScope, identifier: string, now = Date.now()): RateLimitResult {
    const rule = this.rules[scope];
    if (!this.enabled) {
      return {
        allowed: true,
        limit: rule.limit,
        remaining: rule.limit,
        resetAt: now + rule.windowMs,
        retryAfterSeconds: 0
      };
    }

    const key = `${scope}:${identifier}`;
    const existing = this.buckets.get(key);
    const bucket = !existing || now >= existing.resetAt ? { count: 0, resetAt: now + rule.windowMs } : existing;

    if (bucket.count >= rule.limit) {
      return {
        allowed: false,
        limit: rule.limit,
        remaining: 0,
        resetAt: bucket.resetAt,
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
      };
    }

    bucket.count += 1;
    this.buckets.set(key, bucket);

    return {
      allowed: true,
      limit: rule.limit,
      remaining: Math.max(0, rule.limit - bucket.count),
      resetAt: bucket.resetAt,
      retryAfterSeconds: 0
    };
  }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "anonymous";
  }

  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}
