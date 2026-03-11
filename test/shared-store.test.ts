import { describe, expect, it } from "vitest";

import { SharedCacheStore, createCacheEnvelope } from "../src/lib/cache.js";
import { RedisRateLimiter } from "../src/lib/rate-limit.js";
import type { SharedStoreClient, SharedStoreSetOptions } from "../src/lib/shared-store.js";
import { sampleSkill, testConfig } from "./fixtures.js";

class FakeSharedStoreClient implements SharedStoreClient {
  private readonly entries = new Map<string, { value: string; expiresAt: number | null }>();

  constructor(private now = Date.now()) {}

  async get(key: string): Promise<string | null> {
    const entry = this.entries.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt !== null && entry.expiresAt <= this.now) {
      this.entries.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, options?: SharedStoreSetOptions): Promise<unknown> {
    const current = await this.get(key);
    if (options?.nx && current !== null) {
      return null;
    }

    this.entries.set(key, {
      value,
      expiresAt: options?.px ? this.now + options.px : null
    });

    return "OK";
  }

  async incr(key: string): Promise<number> {
    const currentValue = Number((await this.get(key)) ?? "0");
    const existing = this.entries.get(key);
    const next = currentValue + 1;

    this.entries.set(key, {
      value: String(next),
      expiresAt: existing?.expiresAt ?? null
    });

    return next;
  }

  advance(ms: number): void {
    this.now += ms;
  }
}

describe("SharedCacheStore", () => {
  it("persists and retrieves cache envelopes via the shared client", async () => {
    const now = Date.now();
    const client = new FakeSharedStoreClient(now);
    const store = new SharedCacheStore(client, "clawbadge:cache:");
    const envelope = createCacheEnvelope(
      sampleSkill,
      now,
      testConfig.cacheTtlMs,
      testConfig.staleTtlMs
    );

    await store.set("skill:free-ride", envelope);
    const restored = await store.get("skill:free-ride");

    expect(restored).toEqual(envelope);
  });
});

describe("RedisRateLimiter", () => {
  it("shares the same window across requests and resets after expiry", async () => {
    const client = new FakeSharedStoreClient(1_700_000_000_000);
    const limiter = new RedisRateLimiter(true, client, "clawbadge:ratelimit:", {
      badge: { limit: 2, windowMs: 10_000 },
      api: { limit: 30, windowMs: 60_000 },
      page: { limit: 20, windowMs: 60_000 }
    });

    const first = await limiter.check("badge", "203.0.113.7", 1_700_000_000_000);
    const second = await limiter.check("badge", "203.0.113.7", 1_700_000_000_100);
    const third = await limiter.check("badge", "203.0.113.7", 1_700_000_000_200);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);

    client.advance(10_000);

    const reset = await limiter.check("badge", "203.0.113.7", 1_700_000_010_200);
    expect(reset.allowed).toBe(true);
  });
});
