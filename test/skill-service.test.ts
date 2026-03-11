import { describe, expect, it, vi } from "vitest";

import { createCacheEnvelope, MemoryCacheStore } from "../src/lib/cache.js";
import { UpstreamError } from "../src/lib/errors.js";
import { SkillService } from "../src/services/skill-service.js";
import type { NormalizedSkill } from "../src/types.js";
import { sampleSkill, testConfig } from "./fixtures.js";

describe("SkillService", () => {
  it("returns stale cache immediately while revalidating", async () => {
    const cache = new MemoryCacheStore<NormalizedSkill>(10);
    const staleStart = Date.now() - (testConfig.cacheTtlMs + 1_000);
    await cache.set(
      "skill:free-ride",
      createCacheEnvelope(sampleSkill, staleStart, testConfig.cacheTtlMs, testConfig.staleTtlMs)
    );

    const fetchMock = vi.fn().mockRejectedValue(new UpstreamError("upstream down"));
    const service = new SkillService(testConfig, {
      cache,
      fetch: fetchMock as typeof fetch
    });

    const result = await service.getSkillBySlug("free-ride");

    expect(result.source).toBe("stale-cache");
    expect(result.skill.slug).toBe("free-ride");
  });

  it("does not serve expired cache entries on upstream failure", async () => {
    const cache = new MemoryCacheStore<NormalizedSkill>(10);
    const expiredStart =
      Date.now() - testConfig.cacheTtlMs - testConfig.staleTtlMs - 1_000;

    await cache.set(
      "skill:free-ride",
      createCacheEnvelope(sampleSkill, expiredStart, testConfig.cacheTtlMs, testConfig.staleTtlMs)
    );

    const fetchMock = vi.fn().mockRejectedValue(new UpstreamError("upstream down"));
    const service = new SkillService(testConfig, {
      cache,
      fetch: fetchMock as typeof fetch
    });

    await expect(service.getSkillBySlug("free-ride")).rejects.toBeInstanceOf(UpstreamError);
  });
});
