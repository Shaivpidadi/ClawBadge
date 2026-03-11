import { Hono } from "hono";

import { loadConfig, type AppConfig } from "./config.js";
import { SkillService } from "./services/skill-service.js";

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

  return app;
}

const app = createApp();

export default app;
