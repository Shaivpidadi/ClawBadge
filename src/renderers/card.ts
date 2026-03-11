import { compactNumber, formatInteger, formatUpdatedDate, formatVersion, truncateText } from "../lib/format.js";
import { escapeXml } from "../lib/svg.js";
import type { NormalizedSkill, ThemeName } from "../types.js";
import { getThemePalette } from "./theme.js";

type CardOptions = {
  theme: ThemeName;
  compact?: boolean;
  showOwner?: boolean;
  showUpdated?: boolean;
};

type ErrorCardOptions = {
  title: string;
  message: string;
  theme: ThemeName;
};

function renderCardDefs(theme: ThemeName): string {
  if (theme === "dark") {
    return `<defs>
      <linearGradient id="bg-dark" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#111827" />
      </linearGradient>
    </defs>`;
  }

  if (theme === "flat") {
    return "";
  }

  return `<defs>
    <linearGradient id="bg-default" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#eff6ff" />
      <stop offset="55%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#ecfeff" />
    </linearGradient>
  </defs>`;
}

export function renderSkillCard(skill: NormalizedSkill, options: CardOptions): string {
  const palette = getThemePalette(options.theme).card;
  const width = options.compact ? 360 : 420;
  const height = options.compact ? 224 : 244;
  const summary = truncateText(skill.summary || "Live ClawHub skill metrics for your README.", options.compact ? 92 : 120);
  const ownerText = options.showOwner && skill.owner.handle ? `by @${skill.owner.handle}` : "Public ClawHub skill";
  const updated = options.showUpdated ? formatUpdatedDate(skill.updatedAt) : null;

  const metrics = [
    { label: "Downloads", value: compactNumber(skill.downloads), detail: formatInteger(skill.downloads) },
    { label: "Installed now", value: compactNumber(skill.installsCurrent), detail: formatInteger(skill.installsCurrent) },
    { label: "Installed ever", value: compactNumber(skill.installsAllTime), detail: formatInteger(skill.installsAllTime) },
    { label: "Stars", value: compactNumber(skill.stars), detail: formatInteger(skill.stars) }
  ];

  const metricPadding = 26;
  const metricGap = 12;
  const metricBlockWidth = Math.floor((width - 2 * metricPadding - 3 * metricGap) / 4);

  const metricBlocks = metrics
    .map((metric, index) => {
      const blockWidth = metricBlockWidth;
      const gap = metricGap;
      const x = metricPadding + index * (blockWidth + gap);

      return `<g transform="translate(${x} 144)">
        <rect width="${blockWidth}" height="62" rx="16" fill="${palette.metricBackground}" stroke="${palette.metricBorder}" />
        <text x="12" y="24" fill="${palette.muted}" font-family="Verdana, DejaVu Sans, sans-serif" font-size="10">${escapeXml(metric.label)}</text>
        <text x="12" y="44" fill="${palette.title}" font-family="Verdana, DejaVu Sans, sans-serif" font-size="18" font-weight="700">${escapeXml(metric.value)}</text>
      </g>`;
    })
    .join("");

  const metadataParts = [ownerText];
  if (updated) {
    metadataParts.push(`Updated ${updated}`);
  }

  const subtitle = metadataParts.join(" • ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-labelledby="card-title card-desc">
  ${renderCardDefs(options.theme)}
  <title id="card-title">${escapeXml(skill.displayName)} on ClawHub</title>
  <desc id="card-desc">${escapeXml(summary)}</desc>
  <rect width="${width}" height="${height}" rx="28" fill="${palette.background}" />
  <rect x="14" y="14" width="${width - 28}" height="${height - 28}" rx="24" fill="${palette.panel}" stroke="${palette.metricBorder}" />
  <circle cx="${width - 54}" cy="42" r="28" fill="${palette.accentMuted}" opacity="0.9" />
  <circle cx="${width - 32}" cy="72" r="18" fill="${palette.accent}" opacity="0.22" />
  <text x="28" y="42" fill="${palette.title}" font-family="Verdana, DejaVu Sans, sans-serif" font-size="26" font-weight="700">${escapeXml(truncateText(skill.displayName, options.compact ? 24 : 32))}</text>
  <rect x="28" y="56" width="${Math.max(88, formatVersion(skill.version).length * 11)}" height="28" rx="14" fill="${palette.pillBackground}" />
  <text x="42" y="74" fill="${palette.pillText}" font-family="Verdana, DejaVu Sans, sans-serif" font-size="13">${escapeXml(formatVersion(skill.version))}</text>
  <text x="28" y="102" fill="${palette.text}" font-family="Verdana, DejaVu Sans, sans-serif" font-size="13">${escapeXml(summary)}</text>
  <text x="28" y="122" fill="${palette.muted}" font-family="Verdana, DejaVu Sans, sans-serif" font-size="12">${escapeXml(subtitle)}</text>
  ${metricBlocks}
</svg>`;
}

export function renderErrorCard({ title, message, theme }: ErrorCardOptions): string {
  const palette = getThemePalette(theme).card;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="200" role="img" aria-labelledby="card-title card-desc">
  ${renderCardDefs(theme)}
  <title id="card-title">${escapeXml(title)}</title>
  <desc id="card-desc">${escapeXml(message)}</desc>
  <rect width="420" height="200" rx="28" fill="${palette.background}" />
  <rect x="16" y="16" width="388" height="168" rx="24" fill="${palette.panel}" stroke="${palette.metricBorder}" />
  <rect x="28" y="34" width="112" height="28" rx="14" fill="${palette.pillBackground}" />
  <text x="44" y="52" fill="${palette.pillText}" font-family="Verdana, DejaVu Sans, sans-serif" font-size="13">ClawBadge</text>
  <text x="28" y="94" fill="${palette.title}" font-family="Verdana, DejaVu Sans, sans-serif" font-size="24" font-weight="700">${escapeXml(title)}</text>
  <text x="28" y="126" fill="${palette.text}" font-family="Verdana, DejaVu Sans, sans-serif" font-size="14">${escapeXml(message)}</text>
  <text x="28" y="154" fill="${palette.muted}" font-family="Verdana, DejaVu Sans, sans-serif" font-size="12">The upstream skill data could not be rendered right now.</text>
</svg>`;
}
