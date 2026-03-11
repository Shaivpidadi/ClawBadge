export type NormalizedSkill = {
  slug: string;
  displayName: string;
  summary: string;
  version: string;
  downloads: number;
  installsCurrent: number;
  installsAllTime: number;
  stars: number;
  comments: number;
  versions: number;
  owner: {
    handle: string | null;
    displayName: string | null;
  };
  createdAt: number | null;
  updatedAt: number | null;
  source: "clawhub";
};

export type CacheEnvelope<T> = {
  value: T;
  fetchedAt: number;
  staleAt: number;
  expiresAt: number;
};

export type SkillLookupResult = {
  skill: NormalizedSkill;
  fetchedAt: number;
  stale: boolean;
  source: "cache" | "stale-cache" | "upstream";
};

export type ThemeName = "default" | "dark" | "flat";

export type BadgeMetric =
  | "downloads"
  | "installs-current"
  | "installs-all-time"
  | "stars"
  | "version";
