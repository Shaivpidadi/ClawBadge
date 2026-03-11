import type { AppConfig } from "../config.js";
import { createSharedStoreClient, createSharedStoreKey, type SharedStoreClient } from "./shared-store.js";

export type RateLimitScope = "badge" | "api" | "page";

export type RateLimitRule = {
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

export interface RateLimiter {
  check(scope: RateLimitScope, identifier: string, now?: number): Promise<RateLimitResult>;
}

export const defaultRateLimitRules: Record<RateLimitScope, RateLimitRule> = {
  badge: { limit: 60, windowMs: 60_000 },
  api: { limit: 30, windowMs: 60_000 },
  page: { limit: 20, windowMs: 60_000 }
};

export class MemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(
    private readonly enabled: boolean,
    private readonly rules: Record<RateLimitScope, RateLimitRule> = defaultRateLimitRules
  ) {}

  async check(scope: RateLimitScope, identifier: string, now = Date.now()): Promise<RateLimitResult> {
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

export class RedisRateLimiter implements RateLimiter {
  private readonly fallback: MemoryRateLimiter;

  constructor(
    private readonly enabled: boolean,
    private readonly client: SharedStoreClient,
    private readonly keyPrefix: string,
    private readonly rules: Record<RateLimitScope, RateLimitRule> = defaultRateLimitRules
  ) {
    this.fallback = new MemoryRateLimiter(enabled, rules);
  }

  async check(scope: RateLimitScope, identifier: string, now = Date.now()): Promise<RateLimitResult> {
    if (!this.enabled) {
      return this.fallback.check(scope, identifier, now);
    }

    const rule = this.rules[scope];
    const windowIndex = Math.floor(now / rule.windowMs);
    const resetAt = (windowIndex + 1) * rule.windowMs;
    const ttlMs = Math.max(1, resetAt - now);
    const key = `${this.keyPrefix}${scope}:${identifier}:${windowIndex}`;

    try {
      const count = await this.client.incr(key);
      if (count === 1) {
        await this.client.pexpire(key, ttlMs);
      }

      return {
        allowed: count <= rule.limit,
        limit: rule.limit,
        remaining: Math.max(0, rule.limit - count),
        resetAt,
        retryAfterSeconds: count <= rule.limit ? 0 : Math.max(1, Math.ceil(ttlMs / 1000))
      };
    } catch {
      return this.fallback.check(scope, identifier, now);
    }
  }
}

export function createRateLimiter(
  config: AppConfig,
  sharedClient: SharedStoreClient | null = createSharedStoreClient(config)
): RateLimiter {
  if (!sharedClient) {
    return new MemoryRateLimiter(config.rateLimitEnabled);
  }

  return new RedisRateLimiter(
    config.rateLimitEnabled,
    sharedClient,
    `${createSharedStoreKey(config, "ratelimit", "")}`
  );
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
