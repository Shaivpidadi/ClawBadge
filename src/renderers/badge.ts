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
    label: "Downloads",
    value: (skill) => compactNumber(skill.downloads)
  },
  "installs-current": {
    label: "Installed",
    value: (skill) => compactNumber(skill.installsCurrent)
  },
  "installs-all-time": {
    label: "All Time",
    value: (skill) => compactNumber(skill.installsAllTime)
  },
  stars: {
    label: "Stars",
    value: (skill) => compactNumber(skill.stars)
  },
  version: {
    label: "Version",
    value: (skill) => formatVersion(skill.version)
  }
};

const ICON_SIZE = 14;
const ICON_SCALE = ICON_SIZE / 120;
// Body + claws from the OpenClaw lobster logo (viewBox 0 0 120 120)
const CLAW_ICON_PATHS = [
  "M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z",
  "M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z",
  "M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z"
];
const CLAW_ICON_DEFS = `<linearGradient id="cb-logo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff4d4d"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </linearGradient>`;

function renderBadgeSvg({ label, value, title, theme }: BadgePayload): string {
  const palette = getThemePalette(theme).badge;
  const height = 26;
  const radius = 13;
  const iconPad = 9;
  const iconTextGap = 6;
  const labelPadRight = 12;
  const valuePadX = 14;

  const labelTextWidth = estimateTextWidth(label, 11);
  const valueTextWidth = estimateTextWidth(value, 11);
  const leftWidth = iconPad + ICON_SIZE + iconTextGap + labelTextWidth + labelPadRight;
  const rightWidth = valuePadX + valueTextWidth + valuePadX;
  const totalWidth = leftWidth + rightWidth;

  const iconY = (height - ICON_SIZE) / 2;
  const labelX = iconPad + ICON_SIZE + iconTextGap;
  const valueX = leftWidth + rightWidth / 2;
  const textY = Math.round(height * 0.64);
  const titleText = escapeXml(title);

  const iconPaths = CLAW_ICON_PATHS.map(
    (d) => `<path d="${d}" fill="url(#cb-logo)"/>`
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="${titleText}">
  <title>${titleText}</title>
  <defs>
    ${CLAW_ICON_DEFS}
    <linearGradient id="cb-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.10"/>
    </linearGradient>
    <clipPath id="cb-clip">
      <rect width="${totalWidth}" height="${height}" rx="${radius}"/>
    </clipPath>
  </defs>
  <g clip-path="url(#cb-clip)">
    <rect width="${leftWidth}" height="${height}" fill="${palette.left}"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="${height}" fill="${palette.right}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#cb-grad)"/>
  </g>
  <g transform="translate(${iconPad}, ${iconY}) scale(${ICON_SCALE.toFixed(5)})"  fill="none">
    ${iconPaths}
  </g>
  <g font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelX + labelTextWidth / 2}" y="${textY}" text-anchor="middle" fill="${palette.text}" opacity="0.78">${escapeXml(label)}</text>
    <text x="${valueX}" y="${textY}" text-anchor="middle" fill="${palette.text}" font-weight="700">${escapeXml(value)}</text>
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
