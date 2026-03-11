import { loadConfig } from "../src/config.js";
import type { NormalizedSkill } from "../src/types.js";

export const testConfig = loadConfig({
  NODE_ENV: "test",
  PORT: "3000",
  CLAWHUB_API_BASE: "https://clawhub.ai/api/v1",
  CACHE_TTL_SECONDS: "300",
  STALE_TTL_SECONDS: "3600",
  UPSTREAM_TIMEOUT_MS: "2500",
  MAX_UPSTREAM_BYTES: "128000",
  MEMORY_CACHE_SIZE: "100",
  RATE_LIMIT_ENABLED: "1",
  LOG_LEVEL: "error"
});

export const sampleSkill: NormalizedSkill = {
  slug: "free-ride",
  displayName: "Free Ride <Unlimited>",
  summary: "Unlimited free AI access for demos & experiments.",
  version: "1.0.4",
  downloads: 32_517,
  installsCurrent: 180,
  installsAllTime: 183,
  stars: 248,
  comments: 23,
  versions: 4,
  owner: {
    handle: "shaivpidadi",
    displayName: "Shaishav Pidadi"
  },
  createdAt: 1770313337350,
  updatedAt: 1772065840450,
  source: "clawhub"
};

export const samplePayload = {
  skill: {
    slug: "free-ride",
    displayName: "Free Ride <Unlimited>",
    summary: "Unlimited free AI access for demos & experiments.",
    tags: {
      latest: "1.0.4"
    },
    stats: {
      comments: 23,
      downloads: 32_517,
      installsAllTime: 183,
      installsCurrent: 180,
      stars: 248,
      versions: 4
    },
    createdAt: 1770313337350,
    updatedAt: 1772065840450
  },
  latestVersion: {
    version: "1.0.4",
    createdAt: 1771429600089
  },
  owner: {
    handle: "shaivpidadi",
    displayName: "Shaishav Pidadi"
  }
};
