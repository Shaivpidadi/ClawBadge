import { LRUCache } from "lru-cache";

import type { AppConfig } from "../config.js";
import type { CacheEnvelope, NormalizedSkill } from "../types.js";
import { createSharedStoreClient, createSharedStoreKey, type SharedStoreClient } from "./shared-store.js";

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

    try {
      const sharedEntry = await this.shared.get(key);
      if (sharedEntry) {
        await this.local.set(key, sharedEntry);
      }

      return sharedEntry;
    } catch {
      return null;
    }
  }

  async set(key: string, entry: CacheEnvelope<T>): Promise<void> {
    await this.local.set(key, entry);

    if (this.shared) {
      try {
        await this.shared.set(key, entry);
      } catch {
        return;
      }
    }
  }
}

export class SharedCacheStore<T> implements CacheStore<T> {
  constructor(
    private readonly client: SharedStoreClient,
    private readonly keyPrefix: string
  ) {}

  async get(key: string): Promise<CacheEnvelope<T> | null> {
    const raw = await this.client.get(`${this.keyPrefix}${key}`);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as CacheEnvelope<T>;
    } catch {
      return null;
    }
  }

  async set(key: string, entry: CacheEnvelope<T>): Promise<void> {
    const ttlMs = Math.max(0, entry.expiresAt - Date.now());
    if (ttlMs <= 0) {
      return;
    }

    await this.client.set(`${this.keyPrefix}${key}`, JSON.stringify(entry), {
      px: ttlMs
    });
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

export function createSkillCache(
  config: AppConfig,
  sharedClient: SharedStoreClient | null = createSharedStoreClient(config)
): CacheStore<NormalizedSkill> {
  const local = new MemoryCacheStore<NormalizedSkill>(config.memoryCacheSize);
  if (!sharedClient) {
    return new LayeredCacheStore(local);
  }

  const shared = new SharedCacheStore<NormalizedSkill>(
    sharedClient,
    `${createSharedStoreKey(config, "cache", "")}`
  );

  return new LayeredCacheStore(local, shared);
}
