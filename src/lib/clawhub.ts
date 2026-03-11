import { z } from "zod";

import type { AppConfig } from "../config.js";
import type { NormalizedSkill } from "../types.js";
import { NotFoundError, UpstreamError, UpstreamPayloadError } from "./errors.js";

const statsSchema = z
  .object({
    comments: z.coerce.number().int().nonnegative().catch(0),
    downloads: z.coerce.number().int().nonnegative().catch(0),
    installsAllTime: z.coerce.number().int().nonnegative().catch(0),
    installsCurrent: z.coerce.number().int().nonnegative().catch(0),
    stars: z.coerce.number().int().nonnegative().catch(0),
    versions: z.coerce.number().int().nonnegative().catch(0)
  })
  .partial()
  .nullish();

const payloadSchema = z.object({
  skill: z.object({
    slug: z.string().min(1),
    displayName: z.string().nullish(),
    summary: z.string().nullish(),
    tags: z
      .object({
        latest: z.string().nullish()
      })
      .partial()
      .nullish(),
    stats: statsSchema,
    createdAt: z.coerce.number().int().nullish(),
    updatedAt: z.coerce.number().int().nullish()
  }),
  latestVersion: z
    .object({
      version: z.string().nullish(),
      createdAt: z.coerce.number().int().nullish()
    })
    .partial()
    .nullish(),
  owner: z
    .object({
      handle: z.string().nullish(),
      displayName: z.string().nullish()
    })
    .partial()
    .nullish()
});

type RawClawHubPayload = z.infer<typeof payloadSchema>;

function normalizeOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function readMetric(
  stats: RawClawHubPayload["skill"]["stats"],
  key: keyof NonNullable<RawClawHubPayload["skill"]["stats"]>
): number {
  return stats?.[key] ?? 0;
}

export function normalizeClawHubPayload(payload: RawClawHubPayload): NormalizedSkill {
  const version =
    normalizeOptionalText(payload.latestVersion?.version) ??
    normalizeOptionalText(payload.skill.tags?.latest) ??
    "unknown";

  return {
    slug: payload.skill.slug,
    displayName: normalizeOptionalText(payload.skill.displayName) ?? payload.skill.slug,
    summary: normalizeOptionalText(payload.skill.summary) ?? "",
    version,
    downloads: readMetric(payload.skill.stats, "downloads"),
    installsCurrent: readMetric(payload.skill.stats, "installsCurrent"),
    installsAllTime: readMetric(payload.skill.stats, "installsAllTime"),
    stars: readMetric(payload.skill.stats, "stars"),
    comments: readMetric(payload.skill.stats, "comments"),
    versions: readMetric(payload.skill.stats, "versions"),
    owner: {
      handle: normalizeOptionalText(payload.owner?.handle),
      displayName: normalizeOptionalText(payload.owner?.displayName)
    },
    createdAt: payload.skill.createdAt ?? null,
    updatedAt: payload.skill.updatedAt ?? null,
    source: "clawhub"
  };
}

async function readJsonWithLimit(response: Response, maxBytes: number): Promise<unknown> {
  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new UpstreamPayloadError("ClawHub payload exceeded the configured limit.");
  }

  if (!response.body) {
    return response.json();
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    size += value.byteLength;
    if (size > maxBytes) {
      throw new UpstreamPayloadError("ClawHub payload exceeded the configured limit.");
    }

    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();

  try {
    return JSON.parse(text);
  } catch {
    throw new UpstreamPayloadError("ClawHub returned malformed JSON.");
  }
}

export async function fetchClawHubSkill(
  slug: string,
  config: AppConfig,
  fetchImpl: typeof fetch = fetch
): Promise<NormalizedSkill> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.upstreamTimeoutMs);
  const requestUrl = new URL(`skills/${slug}`, `${config.clawHubApiBase}/`);

  try {
    const response = await fetchImpl(requestUrl, {
      headers: {
        accept: "application/json"
      },
      signal: controller.signal
    });

    if (response.status === 404) {
      throw new NotFoundError();
    }

    if (!response.ok) {
      throw new UpstreamError(`ClawHub returned HTTP ${response.status}.`);
    }

    const payload = await readJsonWithLimit(response, config.maxUpstreamBytes);
    const parsed = payloadSchema.safeParse(payload);

    if (!parsed.success) {
      throw new UpstreamPayloadError();
    }

    return normalizeClawHubPayload(parsed.data);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UpstreamPayloadError || error instanceof UpstreamError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new UpstreamError("ClawHub timed out.");
    }

    throw new UpstreamError("Failed to reach ClawHub.");
  } finally {
    clearTimeout(timeout);
  }
}
