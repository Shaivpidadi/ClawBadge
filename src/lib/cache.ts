import { LRUCache } from "lru-cache";

import type { AppConfig } from "../config.js";
import type { CacheEnvelope, NormalizedSkill } from "../types.js";

export interface CacheStore<T> {
  get(key: string): Promise<CacheEnvelope<T> | null>;
  set(key: string, entry: CacheEnvelope<T>): Promise<void>;
}

export class MemoryCacheStore<T> implements CacheStore<T> {
  private readonly cache: LRUCache<string, CacheEnvelope<T>>;

  constructor(maxEntries: number) {
    this.cache = new LRUCache({
      max: maxEntries
    });
  }

  async get(key: string): Promise<CacheEnvelope<T> | null> {
    return this.cache.get(key) ?? null;
  }

  async set(key: string, entry: CacheEnvelope<T>): Promise<void> {
    this.cache.set(key, entry);
  }
}

export class LayeredCacheStore<T> implements CacheStore<T> {
  constructor(
    private readonly local: CacheStore<T>,
    private readonly shared?: CacheStore<T>
  ) {}

  async get(key: string): Promise<CacheEnvelope<T> | null> {
    const localEntry = await this.local.get(key);
    if (localEntry) {
      return localEntry;
    }

    if (!this.shared) {
      return null;
    }

    const sharedEntry = await this.shared.get(key);
    if (sharedEntry) {
      await this.local.set(key, sharedEntry);
    }

    return sharedEntry;
  }

  async set(key: string, entry: CacheEnvelope<T>): Promise<void> {
    await this.local.set(key, entry);

    if (this.shared) {
      await this.shared.set(key, entry);
    }
  }
}

export function createCacheEnvelope<T>(
  value: T,
  now: number,
  freshTtlMs: number,
  staleTtlMs: number
): CacheEnvelope<T> {
  return {
    value,
    fetchedAt: now,
    staleAt: now + freshTtlMs,
    expiresAt: now + freshTtlMs + staleTtlMs
  };
}

export function isFresh<T>(entry: CacheEnvelope<T>, now = Date.now()): boolean {
  return now < entry.staleAt;
}

export function isStaleButUsable<T>(entry: CacheEnvelope<T>, now = Date.now()): boolean {
  return now >= entry.staleAt && now < entry.expiresAt;
}

export function createSkillCache(config: AppConfig): CacheStore<NormalizedSkill> {
  const local = new MemoryCacheStore<NormalizedSkill>(config.memoryCacheSize);
  return new LayeredCacheStore(local);
}
