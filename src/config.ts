import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CLAWHUB_API_BASE: z
    .string()
    .url()
    .default("https://clawhub.ai/api/v1"),
  CACHE_TTL_SECONDS: z.coerce.number().int().min(1).default(300),
  STALE_TTL_SECONDS: z.coerce.number().int().min(1).default(3600),
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().min(250).default(2500),
  MAX_UPSTREAM_BYTES: z.coerce.number().int().min(1024).default(128_000),
  MEMORY_CACHE_SIZE: z.coerce.number().int().min(1).default(1_000),
  RATE_LIMIT_ENABLED: z
    .string()
    .optional()
    .transform((value) => value !== "0"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info")
});

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  clawHubApiBase: string;
  cacheTtlMs: number;
  staleTtlMs: number;
  upstreamTimeoutMs: number;
  maxUpstreamBytes: number;
  memoryCacheSize: number;
  rateLimitEnabled: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
};

let memoizedConfig: AppConfig | null = null;

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  if (env === process.env && memoizedConfig) {
    return memoizedConfig;
  }

  const parsed = envSchema.parse(env);
  const config: AppConfig = {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    clawHubApiBase: normalizeBaseUrl(parsed.CLAWHUB_API_BASE),
    cacheTtlMs: parsed.CACHE_TTL_SECONDS * 1000,
    staleTtlMs: parsed.STALE_TTL_SECONDS * 1000,
    upstreamTimeoutMs: parsed.UPSTREAM_TIMEOUT_MS,
    maxUpstreamBytes: parsed.MAX_UPSTREAM_BYTES,
    memoryCacheSize: parsed.MEMORY_CACHE_SIZE,
    rateLimitEnabled: parsed.RATE_LIMIT_ENABLED,
    logLevel: parsed.LOG_LEVEL
  };

  if (env === process.env) {
    memoizedConfig = config;
  }

  return config;
}
