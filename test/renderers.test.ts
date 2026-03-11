import { describe, expect, it } from "vitest";

import { renderMetricBadge } from "../src/renderers/badge.js";
import { renderSkillCard } from "../src/renderers/card.js";
import { sampleSkill } from "./fixtures.js";

describe("SVG renderers", () => {
  it("escapes badge content and matches the snapshot", () => {
    const svg = renderMetricBadge(sampleSkill, "downloads", "default", "downloads <all>");

    expect(svg).toContain("&lt;all&gt;");
    expect(svg).toMatchSnapshot();
  });

  it("renders the summary card snapshot", () => {
    const svg = renderSkillCard(sampleSkill, {
      theme: "dark",
      showOwner: true,
      showUpdated: true
    });

    expect(svg).toContain("&lt;Unlimited&gt;");
    expect(svg).toMatchSnapshot();
  });
});
