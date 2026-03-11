import type { AppConfig } from "../config.js";
import type { CacheStore } from "../lib/cache.js";
import { createCacheEnvelope, createSkillCache, isFresh, isStaleButUsable } from "../lib/cache.js";
import { fetchClawHubSkill } from "../lib/clawhub.js";
import { isRecoverableUpstreamError } from "../lib/errors.js";
import { validateSlug } from "../lib/validation.js";
import type { NormalizedSkill, SkillLookupResult } from "../types.js";

export class SkillService {
  private readonly inflight = new Map<string, Promise<SkillLookupResult>>();

  private readonly cache: CacheStore<NormalizedSkill>;

  constructor(
    private readonly config: AppConfig,
    options?: {
      cache?: CacheStore<NormalizedSkill>;
      fetch?: typeof fetch;
    }
  ) {
    this.cache = options?.cache ?? createSkillCache(config);
    this.fetchImpl = options?.fetch ?? fetch;
  }

  private readonly fetchImpl: typeof fetch;

  async getSkillBySlug(input: string): Promise<SkillLookupResult> {
    const slug = validateSlug(input);
    const cacheKey = `skill:${slug}`;
    const now = Date.now();
    const cached = await this.cache.get(cacheKey);

    if (cached && isFresh(cached, now)) {
      return {
        skill: cached.value,
        fetchedAt: cached.fetchedAt,
        stale: false,
        source: "cache"
      };
    }

    if (cached && isStaleButUsable(cached, now)) {
      this.revalidateInBackground(cacheKey, slug);
      return {
        skill: cached.value,
        fetchedAt: cached.fetchedAt,
        stale: true,
        source: "stale-cache"
      };
    }

    return this.fetchAndCache(cacheKey, slug, cached?.value);
  }

  private revalidateInBackground(cacheKey: string, slug: string): void {
    if (this.inflight.has(cacheKey)) {
      return;
    }

    const promise = this.fetchAndCache(cacheKey, slug)
      .catch(() => undefined)
      .finally(() => {
        this.inflight.delete(cacheKey);
      });

    this.inflight.set(cacheKey, promise as Promise<SkillLookupResult>);
  }

  private async fetchAndCache(
    cacheKey: string,
    slug: string,
    fallbackValue?: NormalizedSkill
  ): Promise<SkillLookupResult> {
    const existing = this.inflight.get(cacheKey);
    if (existing) {
      return existing;
    }

    const promise = this.fetchFresh(cacheKey, slug).finally(() => {
      this.inflight.delete(cacheKey);
    });

    this.inflight.set(cacheKey, promise);

    try {
      return await promise;
    } catch (error) {
      if (fallbackValue && isRecoverableUpstreamError(error)) {
        return {
          skill: fallbackValue,
          fetchedAt: Date.now(),
          stale: true,
          source: "stale-cache"
        };
      }

      throw error;
    }
  }

  private async fetchFresh(cacheKey: string, slug: string): Promise<SkillLookupResult> {
    const now = Date.now();
    const skill = await fetchClawHubSkill(slug, this.config, this.fetchImpl);
    const entry = createCacheEnvelope(skill, now, this.config.cacheTtlMs, this.config.staleTtlMs);

    await this.cache.set(cacheKey, entry);

    return {
      skill,
      fetchedAt: now,
      stale: false,
      source: "upstream"
    };
  }
}
