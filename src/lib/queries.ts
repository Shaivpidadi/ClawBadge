import { z } from "zod";

import type { BadgeMetric } from "../types.js";

export const badgeMetricSchema = z.enum([
  "downloads",
  "installs-current",
  "installs-all-time",
  "stars",
  "version"
]);

export function parseBadgeMetric(metric: string): BadgeMetric | null {
  const parsed = badgeMetricSchema.safeParse(metric);
  return parsed.success ? parsed.data : null;
}

export function parseBooleanFlag(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "yes";
}

export function normalizeLabel(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, 32);
}
