import { Hono } from "hono";

import { loadConfig, type AppConfig } from "./config.js";
import { NotFoundError, ValidationError } from "./lib/errors.js";
import { setHtmlHeaders, setJsonHeaders, setSvgHeaders, normalizeError } from "./lib/http.js";
import { normalizeLabel, parseBadgeMetric, parseBooleanFlag } from "./lib/queries.js";
import { renderErrorBadge, renderMetricBadge } from "./renderers/badge.js";
import { renderErrorCard, renderSkillCard } from "./renderers/card.js";
import { resolveTheme } from "./renderers/theme.js";
import { SkillService } from "./services/skill-service.js";
import { renderGeneratorPage } from "./pages/generator.js";

type AppVariables = {
  config: AppConfig;
  skillService: SkillService;
};

export function createApp(config = loadConfig()): Hono<{ Variables: AppVariables }> {
  const app = new Hono<{ Variables: AppVariables }>();
  const skillService = new SkillService(config);

  app.use("*", async (c, next) => {
    c.set("config", config);
    c.set("skillService", skillService);
    await next();
  });

  app.get("/api/health", (c) =>
    c.json({
      ok: true,
      service: "clawbadge"
    })
  );

  app.get("/", (c) => {
    setHtmlHeaders(c);
    return c.html(
      renderGeneratorPage({
        origin: new URL(c.req.url).origin
      })
    );
  });

  app.get("/api/skills/:slug", async (c) => {
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

  app.get("/badge/:slug/:metric.svg", async (c) => {
    const theme = resolveTheme(c.req.query("theme"));
    const metric = parseBadgeMetric(c.req.param("metric") ?? "");
    const label = normalizeLabel(c.req.query("label"));

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
    const origin = new URL(c.req.url).origin;

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

  return app;
}

const app = createApp();

export default app;
