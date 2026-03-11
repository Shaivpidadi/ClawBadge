import { Hono, type Context } from "hono";

import { loadConfig, type AppConfig } from "./config.js";
import { NotFoundError, RateLimitError, ValidationError } from "./lib/errors.js";
import { setHtmlHeaders, setJsonHeaders, setSvgHeaders, normalizeError } from "./lib/http.js";
import { createLogger, Logger } from "./lib/logger.js";
import { normalizeLabel, parseBadgeMetric, parseBooleanFlag } from "./lib/queries.js";
import { createRateLimiter, getClientIp, type RateLimiter, type RateLimitScope } from "./lib/rate-limit.js";
import { createSharedStoreClient, type SharedStoreClient } from "./lib/shared-store.js";
import { createSkillCache } from "./lib/cache.js";
import { renderErrorBadge, renderMetricBadge } from "./renderers/badge.js";
import { renderErrorCard, renderSkillCard } from "./renderers/card.js";
import { resolveTheme } from "./renderers/theme.js";
import { SkillService } from "./services/skill-service.js";
import { renderGeneratorPage } from "./pages/generator.js";

type AppVariables = {
  config: AppConfig;
  skillService: SkillService;
  logger: Logger;
  rateLimiter: RateLimiter;
};

type AppDependencies = {
  skillService?: SkillService;
  logger?: Logger;
  rateLimiter?: RateLimiter;
  sharedStoreClient?: SharedStoreClient | null;
};

function getForwardedValue(value: string | null | undefined): string | null {
  const first = value?.split(",")[0]?.trim();
  return first ? first : null;
}

function rawHeader(c: Context<{ Variables: AppVariables }>, name: string): string | undefined {
  const { headers } = c.req.raw;
  // Web API Headers (Edge / local Node.js via hono/node-server)
  if (typeof (headers as unknown as { get?: unknown }).get === "function") {
    return (headers as unknown as Headers).get(name) ?? undefined;
  }
  // Node.js IncomingMessage.headers — plain lowercase object (Vercel Node.js runtime)
  const value = (headers as unknown as Record<string, string | string[] | undefined>)[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function resolveRequestOrigin(c: Context<{ Variables: AppVariables }>): string {
  const configuredBaseUrl = c.get("config").appBaseUrl;
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  try {
    return new URL(c.req.url).origin;
  } catch {
    const protocol = getForwardedValue(rawHeader(c, "x-forwarded-proto")) ?? "https";
    const host =
      getForwardedValue(rawHeader(c, "x-forwarded-host")) ??
      getForwardedValue(rawHeader(c, "host"));

    if (host) {
      return `${protocol}://${host}`;
    }

    c.get("logger").warn("resolveRequestOrigin.fallback", {
      url: c.req.url,
      reason: "no host header and URL parsing failed"
    });

    return "http://localhost";
  }
}

async function applyRateLimitHeaders(
  c: Context<{ Variables: AppVariables }>,
  scope: RateLimitScope
): Promise<RateLimitError | null> {
  const rateLimit = await c.get("rateLimiter").check(scope, getClientIp((name) => rawHeader(c, name)));
  c.header("X-RateLimit-Limit", String(rateLimit.limit));
  c.header("X-RateLimit-Remaining", String(rateLimit.remaining));
  c.header("X-RateLimit-Reset", String(Math.ceil(rateLimit.resetAt / 1000)));

  if (!rateLimit.allowed) {
    c.header("Retry-After", String(rateLimit.retryAfterSeconds));
    return new RateLimitError(rateLimit.retryAfterSeconds);
  }

  return null;
}

export function createApp(config = loadConfig(), dependencies: AppDependencies = {}): Hono<{ Variables: AppVariables }> {
  const app = new Hono<{ Variables: AppVariables }>();
  const sharedStoreClient =
    dependencies.sharedStoreClient === undefined
      ? createSharedStoreClient(config)
      : dependencies.sharedStoreClient;
  const skillService =
    dependencies.skillService ??
    new SkillService(config, {
      cache: createSkillCache(config, sharedStoreClient)
    });
  const logger = dependencies.logger ?? createLogger(config);
  const rateLimiter = dependencies.rateLimiter ?? createRateLimiter(config, sharedStoreClient);

  app.use("*", async (c, next) => {
    c.set("config", config);
    c.set("skillService", skillService);
    c.set("logger", logger);
    c.set("rateLimiter", rateLimiter);
    await next();
  });

  app.use("*", async (c, next) => {
    const startedAt = performance.now();
    await next();
    c.get("logger").info("request.completed", {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      ip: getClientIp((name) => rawHeader(c, name)),
      source: c.res.headers.get("X-ClawBadge-Source") ?? null
    });
  });

  app.get("/api/health", (c) =>
    c.json({
      ok: true,
      service: "clawbadge"
    })
  );

  app.get("/", async (c) => {
    const rateLimitError = await applyRateLimitHeaders(c, "page");
    const origin = resolveRequestOrigin(c);
    if (rateLimitError) {
      setHtmlHeaders(c);
      return c.html(
        renderGeneratorPage({
          origin,
          error: {
            title: "Rate limit reached",
            message: "ClawBadge received too many generator requests from this IP. Retry shortly."
          }
        }),
        429
      );
    }

    setHtmlHeaders(c);
    return c.html(
      renderGeneratorPage({
        origin
      })
    );
  });

  app.get("/api/skills/:slug", async (c) => {
    const rateLimitError = await applyRateLimitHeaders(c, "api");
    if (rateLimitError) {
      setJsonHeaders(c);
      return c.json({ error: rateLimitError.code }, rateLimitError.statusCode as 429);
    }

    try {
      const result = await c.get("skillService").getSkillBySlug(c.req.param("slug"));
      setJsonHeaders(c, result.source);
      return c.json(result.skill);
    } catch (error) {
      const normalized = normalizeError(error);
      setJsonHeaders(c);
      return c.json({ error: normalized.code }, normalized.statusCode as 400 | 404 | 500 | 502 | 503);
    }
  });

  app.get("/badge/:slug/card.svg", async (c) => {
    const theme = resolveTheme(c.req.query("theme"));
    const showOwner = parseBooleanFlag(c.req.query("showOwner"));
    const showUpdated = parseBooleanFlag(c.req.query("showUpdated"));
    const compact = parseBooleanFlag(c.req.query("compact"));
    const rateLimitError = await applyRateLimitHeaders(c, "badge");

    if (rateLimitError) {
      setSvgHeaders(c);
      return c.body(
        renderErrorCard({
          theme,
          title: "Rate limited",
          message: "ClawBadge received too many badge requests from this IP."
        }),
        429
      );
    }

    try {
      const result = await c.get("skillService").getSkillBySlug(c.req.param("slug"));
      setSvgHeaders(c, result.source);
      return c.body(
        renderSkillCard(result.skill, {
          theme,
          compact,
          showOwner,
          showUpdated
        })
      );
    } catch (error) {
      const normalized = normalizeError(error);
      setSvgHeaders(c);
      return c.body(
        renderErrorCard({
          theme,
          title: normalized instanceof NotFoundError ? "Skill not found" : "Skill unavailable",
          message:
            normalized instanceof ValidationError
              ? "ClawHub slugs must use lowercase letters, numbers, and hyphens."
              : normalized instanceof NotFoundError
                ? "ClawHub does not expose a public skill with this slug."
                : "ClawHub could not be reached, so ClawBadge returned a fallback card."
        }),
        normalized.statusCode as 400 | 404 | 500 | 502 | 503
      );
    }
  });

  app.get("/badge/:slug/:asset", async (c) => {
    const theme = resolveTheme(c.req.query("theme"));
    const asset = c.req.param("asset") ?? "";
    const metric = asset.endsWith(".svg") ? parseBadgeMetric(asset.slice(0, -4)) : null;
    const label = normalizeLabel(c.req.query("label"));
    const rateLimitError = await applyRateLimitHeaders(c, "badge");

    if (rateLimitError) {
      setSvgHeaders(c);
      return c.body(
        renderErrorBadge(label ?? "clawhub", "rate limited", theme),
        429
      );
    }

    if (!metric) {
      setSvgHeaders(c);
      return c.body(
        renderErrorBadge("clawhub", "invalid metric", theme, "Unsupported badge metric."),
        400
      );
    }

    try {
      const result = await c.get("skillService").getSkillBySlug(c.req.param("slug"));
      setSvgHeaders(c, result.source);
      return c.body(renderMetricBadge(result.skill, metric, theme, label));
    } catch (error) {
      const normalized = normalizeError(error);
      setSvgHeaders(c);
      const value =
        normalized instanceof ValidationError
          ? "invalid slug"
          : normalized instanceof NotFoundError
            ? "not found"
            : "unavailable";

      return c.body(
        renderErrorBadge(label ?? "clawhub", value, theme),
        normalized.statusCode as 400 | 404 | 500 | 502 | 503
      );
    }
  });

  app.get("/generate/:slug", async (c) => {
    const origin = resolveRequestOrigin(c);
    const rateLimitError = await applyRateLimitHeaders(c, "page");

    if (rateLimitError) {
      setHtmlHeaders(c);
      return c.html(
        renderGeneratorPage({
          origin,
          slug: c.req.param("slug"),
          error: {
            title: "Rate limit reached",
            message: "ClawBadge received too many generator requests from this IP. Retry shortly."
          }
        }),
        429
      );
    }

    try {
      const result = await c.get("skillService").getSkillBySlug(c.req.param("slug"));
      setHtmlHeaders(c);
      return c.html(
        renderGeneratorPage({
          origin,
          slug: result.skill.slug,
          skill: result.skill
        })
      );
    } catch (error) {
      const normalized = normalizeError(error);
      setHtmlHeaders(c);
      return c.html(
        renderGeneratorPage({
          origin,
          slug: c.req.param("slug"),
          error: {
            title: normalized instanceof NotFoundError ? "Skill not found" : "Unable to generate snippets",
            message:
              normalized instanceof ValidationError
                ? "The provided slug is invalid. Use lowercase letters, numbers, and single hyphens only."
                : normalized instanceof NotFoundError
                  ? "ClawHub does not expose a public skill with that slug right now."
                  : "ClawBadge could not fetch a valid public response from ClawHub."
          }
        }),
        normalized.statusCode as 400 | 404 | 500 | 502 | 503
      );
    }
  });

  app.notFound((c) => {
    setJsonHeaders(c);
    return c.json({ error: "not_found" }, 404);
  });

  return app;
}

const app = createApp();

export default app;
