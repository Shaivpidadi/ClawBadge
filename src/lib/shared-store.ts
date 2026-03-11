import { Redis } from "@upstash/redis";

import type { AppConfig } from "../config.js";

export type SharedStoreSetOptions = {
  nx?: true;
  px?: number;
};

export interface SharedStoreClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: SharedStoreSetOptions): Promise<unknown>;
  incr(key: string): Promise<number>;
}

export function createSharedStoreClient(config: AppConfig): SharedStoreClient | null {
  if (!config.sharedStoreUrl || !config.sharedStoreToken) {
    return null;
  }

  const redis = new Redis({
    url: config.sharedStoreUrl,
    token: config.sharedStoreToken
  });

  return {
    get(key) {
      return redis.get<string>(key);
    },
    set(key, value, options) {
      if (options?.nx && options.px) {
        return redis.set(key, value, { nx: true, px: options.px });
      }

      if (options?.nx) {
        return redis.set(key, value, { nx: true });
      }

      if (options?.px) {
        return redis.set(key, value, { px: options.px });
      }

      return redis.set(key, value);
    },
    incr(key) {
      return redis.incr(key);
    }
  };
}

export function createSharedStoreKey(
  config: AppConfig,
  namespace: string,
  key: string
): string {
  return `${config.sharedStoreKeyPrefix}:${namespace}:${key}`;
}
