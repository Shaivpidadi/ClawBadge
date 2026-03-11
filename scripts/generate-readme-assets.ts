import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { renderMetricBadge } from "../src/renderers/badge.js";
import { renderSkillCard } from "../src/renderers/card.js";
import type { NormalizedSkill } from "../src/types.js";

const sampleSkill: NormalizedSkill = {
  slug: "free-ride",
  displayName: "Free Ride - Unlimited free AI",
  summary: "Unlimited free AI access for demos, quick experiments, and README-friendly previews.",
  version: "1.0.4",
  downloads: 32_517,
  installsCurrent: 180,
  installsAllTime: 183,
  stars: 248,
  comments: 23,
  versions: 4,
  owner: {
    handle: "shaivpidadi",
    displayName: "Shaishav Pidadi"
  },
  createdAt: 1770313337350,
  updatedAt: 1772065840450,
  source: "clawhub"
};

const assetFiles = {
  "readme-downloads.svg": renderMetricBadge(sampleSkill, "downloads", "default"),
  "readme-installs-current.svg": renderMetricBadge(sampleSkill, "installs-current", "default"),
  "readme-stars.svg": renderMetricBadge(sampleSkill, "stars", "default"),
  "readme-version.svg": renderMetricBadge(sampleSkill, "version", "flat"),
  "readme-card.svg": renderSkillCard(sampleSkill, {
    theme: "flat",
    showOwner: true,
    showUpdated: true
  })
};

const assetsDir = new URL("../assets/", import.meta.url);
await mkdir(fileURLToPath(assetsDir), { recursive: true });

await Promise.all(
  Object.entries(assetFiles).map(([filename, contents]) =>
    writeFile(new URL(filename, assetsDir), contents, "utf8")
  )
);

console.log(`Generated ${Object.keys(assetFiles).length} README asset(s).`);
