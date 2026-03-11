import { describe, expect, it, vi } from "vitest";

import { fetchClawHubSkill, normalizeClawHubPayload } from "../src/lib/clawhub.js";
import { UpstreamPayloadError } from "../src/lib/errors.js";
import { samplePayload, testConfig } from "./fixtures.js";

describe("normalizeClawHubPayload", () => {
  it("prefers latestVersion.version over tags.latest", () => {
    const normalized = normalizeClawHubPayload(samplePayload);
    expect(normalized.version).toBe("1.0.4");
  });

  it("falls back to skill.tags.latest when latestVersion is missing", () => {
    const normalized = normalizeClawHubPayload({
      ...samplePayload,
      latestVersion: null
    });

    expect(normalized.version).toBe("1.0.4");
  });
});

describe("fetchClawHubSkill", () => {
  it("rejects malformed payloads", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ nope: true }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      })
    );

    await expect(fetchClawHubSkill("free-ride", testConfig, fetchMock as typeof fetch)).rejects.toBeInstanceOf(
      UpstreamPayloadError
    );
  });
});
