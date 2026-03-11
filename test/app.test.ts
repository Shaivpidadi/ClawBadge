import { describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app.js";
import { MemoryRateLimiter } from "../src/lib/rate-limit.js";
import type { SkillService } from "../src/services/skill-service.js";
import { sampleSkill, testConfig } from "./fixtures.js";

describe("app routes", () => {
  it("returns normalized JSON with cache headers", async () => {
    const skillService = {
      getSkillBySlug: vi.fn().mockResolvedValue({
        skill: sampleSkill,
        fetchedAt: Date.now(),
        stale: false,
        source: "upstream"
      })
    } as unknown as SkillService;

    const app = createApp(testConfig, { skillService });
    const response = await app.request(
      new Request("http://localhost/api/skills/free-ride", {
        headers: {
          "x-forwarded-for": "203.0.113.10"
        }
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("stale-while-revalidate");
    expect(await response.json()).toMatchObject({
      slug: "free-ride",
      version: "1.0.4"
    });
  });

  it("rate limits badge routes by IP", async () => {
    const skillService = {
      getSkillBySlug: vi.fn().mockResolvedValue({
        skill: sampleSkill,
        fetchedAt: Date.now(),
        stale: false,
        source: "upstream"
      })
    } as unknown as SkillService;

    const rateLimiter = new MemoryRateLimiter(true, {
      badge: { limit: 1, windowMs: 60_000 },
      api: { limit: 30, windowMs: 60_000 },
      page: { limit: 20, windowMs: 60_000 }
    });

    const app = createApp(testConfig, { skillService, rateLimiter });
    const firstResponse = await app.request(
      new Request("http://localhost/badge/free-ride/downloads.svg", {
        headers: {
          "x-forwarded-for": "203.0.113.11"
        }
      })
    );
    const secondResponse = await app.request(
      new Request("http://localhost/badge/free-ride/downloads.svg", {
        headers: {
          "x-forwarded-for": "203.0.113.11"
        }
      })
    );

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(429);
    expect(await secondResponse.text()).toContain("rate limited");
  });

  it("handles path-only request URLs without throwing", async () => {
    const app = createApp({
      ...testConfig,
      appBaseUrl: null
    });

    const request = new Request("http://localhost/", {
      headers: {
        host: "api.clawhub-badge.xyz",
        "x-forwarded-proto": "https",
        "x-forwarded-for": "203.0.113.12"
      }
    });

    Object.defineProperty(request, "url", {
      value: "/",
      configurable: true
    });

    const response = await app.request(request);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("https://api.clawhub-badge.xyz");
  });
});
