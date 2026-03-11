import { compactNumber, formatVersion } from "../lib/format.js";
import { escapeXml, estimateTextWidth } from "../lib/svg.js";
import type { BadgeMetric, NormalizedSkill, ThemeName } from "../types.js";
import { getThemePalette } from "./theme.js";

type BadgePayload = {
  label: string;
  value: string;
  title: string;
  theme: ThemeName;
};

const metricConfig: Record<
  BadgeMetric,
  {
    label: string;
    value: (skill: NormalizedSkill) => string;
  }
> = {
  downloads: {
    label: "downloads",
    value: (skill) => compactNumber(skill.downloads)
  },
  "installs-current": {
    label: "installs now",
    value: (skill) => compactNumber(skill.installsCurrent)
  },
  "installs-all-time": {
    label: "installs ever",
    value: (skill) => compactNumber(skill.installsAllTime)
  },
  stars: {
    label: "stars",
    value: (skill) => compactNumber(skill.stars)
  },
  version: {
    label: "version",
    value: (skill) => formatVersion(skill.version)
  }
};

function renderBadgeSvg({ label, value, title, theme }: BadgePayload): string {
  const palette = getThemePalette(theme).badge;
  const leftWidth = estimateTextWidth(label, 11) + 18;
  const rightWidth = estimateTextWidth(value, 11) + 18;
  const totalWidth = leftWidth + rightWidth;
  const titleText = escapeXml(title);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="24" role="img" aria-label="${titleText}">
  <title>${titleText}</title>
  <rect width="${leftWidth}" height="24" rx="12" fill="${palette.left}" stroke="${palette.border}" />
  <rect x="${leftWidth - 12}" width="${rightWidth + 12}" height="24" rx="12" fill="${palette.right}" stroke="${palette.border}" />
  <rect x="${leftWidth - 1}" y="3" width="1" height="18" fill="rgba(255,255,255,0.18)" />
  <g fill="${palette.text}" font-family="Verdana, DejaVu Sans, sans-serif" font-size="11">
    <text x="${leftWidth / 2}" y="15" text-anchor="middle">${escapeXml(label)}</text>
    <text x="${leftWidth + rightWidth / 2}" y="15" text-anchor="middle">${escapeXml(value)}</text>
  </g>
</svg>`;
}

export function renderMetricBadge(
  skill: NormalizedSkill,
  metric: BadgeMetric,
  theme: ThemeName,
  customLabel?: string
): string {
  const config = metricConfig[metric];
  const label = customLabel?.trim() || config.label;
  const value = config.value(skill);

  return renderBadgeSvg({
    label,
    value,
    title: `${skill.displayName} ${label}: ${value}`,
    theme
  });
}

export function renderErrorBadge(
  label: string,
  value: string,
  theme: ThemeName,
  title = `${label}: ${value}`
): string {
  return renderBadgeSvg({
    label,
    value,
    title,
    theme
  });
}
