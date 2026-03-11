import { compactNumber, formatInteger, formatUpdatedDate, formatVersion, truncateText } from "../lib/format.js";
import { escapeXml } from "../lib/svg.js";
import type { NormalizedSkill } from "../types.js";

type GeneratorPageOptions = {
  slug?: string;
  origin: string;
  skill?: NormalizedSkill;
  error?: {
    title: string;
    message: string;
  };
};

type MarkdownSnippets = {
  downloads: string;
  multi: string;
  card: string;
};

type SnippetBlock = {
  id: string;
  title: string;
  eyebrow: string;
  snippet: string;
};

function buildMarkdown(origin: string, slug: string, theme: "default" | "dark" | "flat"): MarkdownSnippets {
  const skillUrl = `https://clawhub.ai/skills/${slug}`;
  const badgeBase = `${origin}/badge/${slug}`;
  const themeQuery = theme === "default" ? "" : `?theme=${theme}`;

  return {
    downloads: `[![ClawHub Downloads](${badgeBase}/downloads.svg${themeQuery})](${skillUrl})`,
    multi: [
      `[![ClawHub Downloads](${badgeBase}/downloads.svg${themeQuery})](${skillUrl})`,
      `[![ClawHub Current Installs](${badgeBase}/installs-current.svg${themeQuery})](${skillUrl})`,
      `[![ClawHub Stars](${badgeBase}/stars.svg${themeQuery})](${skillUrl})`,
      `[![ClawHub Version](${badgeBase}/version.svg${themeQuery})](${skillUrl})`
    ].join("\n"),
    card: `[![ClawHub Card](${badgeBase}/card.svg${themeQuery})](${skillUrl})`
  };
}

function renderBrandMark(): string {
  return `<svg class="brand-mark" viewBox="0 0 260 220" aria-hidden="true">
    <defs>
      <linearGradient id="brand-shell" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stop-color="#ff8b57" />
        <stop offset="100%" stop-color="#d64d2f" />
      </linearGradient>
      <linearGradient id="brand-panel" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stop-color="#0b1d2d" />
        <stop offset="100%" stop-color="#10354a" />
      </linearGradient>
      <linearGradient id="brand-belly" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stop-color="#f7d7ad" />
        <stop offset="100%" stop-color="#fff2df" />
      </linearGradient>
    </defs>
    <rect x="24" y="16" width="212" height="188" rx="44" fill="url(#brand-panel)" />
    <rect x="39" y="31" width="182" height="158" rx="34" fill="#081623" stroke="rgba(125, 211, 252, 0.2)" />
    <circle cx="76" cy="68" r="32" fill="url(#brand-shell)" />
    <circle cx="184" cy="68" r="32" fill="url(#brand-shell)" />
    <circle cx="89" cy="70" r="12" fill="#081623" />
    <circle cx="171" cy="70" r="12" fill="#081623" />
    <path d="M65 41c11-11 25-17 40-18" fill="none" stroke="#8fe4ff" stroke-linecap="round" stroke-width="5" />
    <path d="M195 41c-11-11-25-17-40-18" fill="none" stroke="#8fe4ff" stroke-linecap="round" stroke-width="5" />
    <rect x="109" y="82" width="42" height="60" rx="21" fill="url(#brand-belly)" />
    <rect x="96" y="112" width="68" height="16" rx="8" fill="#76d7f7" />
    <rect x="84" y="141" width="92" height="18" rx="9" fill="#ff8b57" />
    <rect x="95" y="165" width="70" height="11" rx="5.5" fill="#0f766e" />
    <circle cx="64" cy="116" r="8" fill="#0f766e" />
    <circle cx="196" cy="116" r="8" fill="#0f766e" />
    <circle cx="130" cy="52" r="8" fill="#ffe8bf" />
  </svg>`;
}

function renderSnippetBlock({ id, title, eyebrow, snippet }: SnippetBlock): string {
  return `<section class="snippet-card">
    <div class="snippet-card-head">
      <div>
        <p class="mini-label">${escapeXml(eyebrow)}</p>
        <h3>${escapeXml(title)}</h3>
      </div>
      <button class="copy-button" type="button" data-copy-target="${escapeXml(id)}">Copy</button>
    </div>
    <pre id="${escapeXml(id)}">${escapeXml(snippet)}</pre>
  </section>`;
}

function renderBadgeRail(origin: string, slug: string, theme: "default" | "dark" | "flat", title: string, subtitle: string): string {
  const suffix = theme === "default" ? "" : `?theme=${theme}`;

  return `<section class="rail-card theme-${escapeXml(theme)}">
    <div class="rail-head">
      <div>
        <p class="mini-label">${escapeXml(theme)}</p>
        <h3>${escapeXml(title)}</h3>
      </div>
      <span class="rail-note">${escapeXml(subtitle)}</span>
    </div>
    <div class="rail-stack">
      <img src="${escapeXml(`${origin}/badge/${slug}/downloads.svg${suffix}`)}" alt="Downloads badge ${escapeXml(theme)}" />
      <img src="${escapeXml(`${origin}/badge/${slug}/installs-current.svg${suffix}`)}" alt="Current installs badge ${escapeXml(theme)}" />
      <img src="${escapeXml(`${origin}/badge/${slug}/stars.svg${suffix}`)}" alt="Stars badge ${escapeXml(theme)}" />
      <img src="${escapeXml(`${origin}/badge/${slug}/version.svg${suffix}`)}" alt="Version badge ${escapeXml(theme)}" />
    </div>
  </section>`;
}

function renderMetricTiles(skill: NormalizedSkill): string {
  const tiles = [
    {
      label: "Downloads",
      value: formatInteger(skill.downloads),
      accent: compactNumber(skill.downloads)
    },
    {
      label: "Installed now",
      value: formatInteger(skill.installsCurrent),
      accent: compactNumber(skill.installsCurrent)
    },
    {
      label: "Installed ever",
      value: formatInteger(skill.installsAllTime),
      accent: compactNumber(skill.installsAllTime)
    },
    {
      label: "Stars",
      value: formatInteger(skill.stars),
      accent: compactNumber(skill.stars)
    }
  ];

  return tiles
    .map(
      (tile) => `<article class="metric-tile">
        <p class="mini-label">${escapeXml(tile.label)}</p>
        <strong>${escapeXml(tile.value)}</strong>
        <span>${escapeXml(tile.accent)} badge label</span>
      </article>`
    )
    .join("");
}

function renderEmptyState(origin: string): string {
  const examples = [
    {
      title: "Paste a slug",
      body: "Start with a public ClawHub skill slug such as free-ride. The generator fetches live public stats only.",
      accent: "01"
    },
    {
      title: "Preview the embeds",
      body: "Inspect badge rails, dark and flat themes, and the larger summary card before you ship it to a README.",
      accent: "02"
    },
    {
      title: "Copy markdown",
      body: "Use stable URLs from the API host so future marketing pages on the root domain never break embedded badges.",
      accent: "03"
    }
  ];

  const exampleCards = examples
    .map(
      (example) => `<article class="empty-card">
        <span class="empty-card-index">${escapeXml(example.accent)}</span>
        <h3>${escapeXml(example.title)}</h3>
        <p>${escapeXml(example.body)}</p>
      </article>`
    )
    .join("");

  return `<section class="workspace empty-workspace">
    <div class="workspace-head">
      <div>
        <p class="section-label">Launch sequence</p>
        <h2>Build once, paste everywhere.</h2>
      </div>
      <span class="workspace-pill">${escapeXml(origin)}</span>
    </div>
    <div class="empty-grid">
      ${exampleCards}
      <article class="console-card">
        <p class="section-label">Example endpoints</p>
        <code>GET ${escapeXml(origin)}/api/skills/free-ride</code>
        <code>GET ${escapeXml(origin)}/badge/free-ride/downloads.svg</code>
        <code>GET ${escapeXml(origin)}/badge/free-ride/card.svg?theme=flat</code>
        <code>GET ${escapeXml(origin)}/generate/free-ride</code>
      </article>
    </div>
  </section>`;
}

function renderPreviewSection(skill: NormalizedSkill, origin: string, defaultMarkdown: MarkdownSnippets, darkMarkdown: MarkdownSnippets, flatMarkdown: MarkdownSnippets): string {
  const updated = formatUpdatedDate(skill.updatedAt) ?? "Live";
  const descriptor = skill.owner.handle ? `by @${skill.owner.handle}` : "Public ClawHub skill";
  const summary = truncateText(skill.summary || "Live ClawHub skill metrics for README embeds.", 168);
  const snippets: SnippetBlock[] = [
    {
      id: "snippet-single",
      title: "Single badge",
      eyebrow: "Markdown",
      snippet: defaultMarkdown.downloads
    },
    {
      id: "snippet-row",
      title: "Default badge row",
      eyebrow: "Markdown",
      snippet: defaultMarkdown.multi
    },
    {
      id: "snippet-card",
      title: "Summary card",
      eyebrow: "Markdown",
      snippet: defaultMarkdown.card
    },
    {
      id: "snippet-dark-card",
      title: "Dark card",
      eyebrow: "Markdown",
      snippet: darkMarkdown.card
    },
    {
      id: "snippet-flat-row",
      title: "Flat theme row",
      eyebrow: "Markdown",
      snippet: flatMarkdown.multi
    }
  ];

  return `<section class="workspace skill-workspace">
      <div class="workspace-head">
        <div>
          <p class="section-label">Live specimen</p>
          <h2>${escapeXml(skill.displayName)}</h2>
          <p class="workspace-copy">${escapeXml(summary)}</p>
        </div>
        <div class="workspace-meta">
          <span class="workspace-pill">${escapeXml(skill.slug)}</span>
          <span class="workspace-pill workspace-pill-muted">${escapeXml(descriptor)}</span>
          <span class="workspace-pill workspace-pill-muted">${escapeXml(`Updated ${updated}`)}</span>
          <span class="workspace-pill workspace-pill-accent">${escapeXml(formatVersion(skill.version))}</span>
        </div>
      </div>
      <div class="metric-grid">
        ${renderMetricTiles(skill)}
      </div>
    </section>
    <section class="workspace display-grid">
      <div class="feature-card stage-card">
        <div class="stage-head">
          <div>
            <p class="section-label">Card studio</p>
            <h2>README-ready hero asset</h2>
          </div>
          <a class="text-link" href="${escapeXml(`https://clawhub.ai/skills/${skill.slug}`)}" target="_blank" rel="noreferrer">Open on ClawHub</a>
        </div>
        <img class="card-preview main-card" src="${escapeXml(`${origin}/badge/${skill.slug}/card.svg?theme=flat&showOwner=1&showUpdated=1`)}" alt="Flat ClawHub summary card" />
        <img class="card-preview secondary-card" src="${escapeXml(`${origin}/badge/${skill.slug}/card.svg?theme=dark&showOwner=1&showUpdated=1`)}" alt="Dark ClawHub summary card" />
      </div>
      <div class="feature-card rail-group">
        <div class="stage-head">
          <div>
            <p class="section-label">Badge rails</p>
            <h2>Three visual tones</h2>
          </div>
        </div>
        ${renderBadgeRail(origin, skill.slug, "default", "Registry default", "Balanced sea-glass contrast")}
        ${renderBadgeRail(origin, skill.slug, "dark", "Night dive", "For darker README palettes")}
        ${renderBadgeRail(origin, skill.slug, "flat", "Shell amber", "Warm lobster-accented row")}
      </div>
    </section>
    <section class="workspace snippet-workspace">
      <div class="workspace-head">
        <div>
          <p class="section-label">Copy deck</p>
          <h2>Ship embeds without hand-editing markdown.</h2>
        </div>
        <span class="workspace-pill">${escapeXml(origin)}</span>
      </div>
      <div class="snippet-grid">
        ${snippets.map(renderSnippetBlock).join("")}
      </div>
    </section>`;
}

export function renderGeneratorPage({ slug, origin, skill, error }: GeneratorPageOptions): string {
  const defaultSlug = slug ?? "";
  const defaultMarkdown = defaultSlug ? buildMarkdown(origin, defaultSlug, "default") : null;
  const darkMarkdown = defaultSlug ? buildMarkdown(origin, defaultSlug, "dark") : null;
  const flatMarkdown = defaultSlug ? buildMarkdown(origin, defaultSlug, "flat") : null;
  const contentSection =
    skill && defaultMarkdown && darkMarkdown && flatMarkdown
      ? renderPreviewSection(skill, origin, defaultMarkdown, darkMarkdown, flatMarkdown)
      : renderEmptyState(origin);

  const errorSection = error
    ? `<section class="workspace status-banner">
        <p class="section-label">Status</p>
        <h2>${escapeXml(error.title)}</h2>
        <p class="workspace-copy">${escapeXml(error.message)}</p>
      </section>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ClawBadge Generator</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #06131d;
        --bg-deep: #04111a;
        --panel: rgba(8, 22, 34, 0.88);
        --panel-strong: rgba(10, 28, 42, 0.96);
        --panel-soft: rgba(11, 31, 45, 0.78);
        --line: rgba(143, 228, 255, 0.16);
        --line-strong: rgba(255, 165, 114, 0.28);
        --text: #f5ecd7;
        --muted: #9bc7d7;
        --muted-strong: #d7f3ff;
        --accent: #ff8b57;
        --accent-deep: #cf4f31;
        --teal: #76d7f7;
        --teal-soft: rgba(118, 215, 247, 0.18);
        --sand: #fff3dd;
        --code: #07141f;
        --shadow: 0 28px 60px rgba(0, 0, 0, 0.34);
      }

      * {
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        min-height: 100vh;
        color: var(--text);
        font-family: "Avenir Next", "Gill Sans", "Trebuchet MS", sans-serif;
        background:
          radial-gradient(circle at 14% 12%, rgba(255, 139, 87, 0.2), transparent 22%),
          radial-gradient(circle at 82% 14%, rgba(118, 215, 247, 0.18), transparent 20%),
          radial-gradient(circle at 74% 78%, rgba(255, 181, 115, 0.16), transparent 24%),
          linear-gradient(180deg, #082030 0%, var(--bg) 44%, var(--bg-deep) 100%);
        overflow-x: hidden;
      }

      body::before,
      body::after {
        content: "";
        position: fixed;
        inset: auto;
        pointer-events: none;
        z-index: 0;
      }

      body::before {
        width: 42rem;
        height: 42rem;
        left: -14rem;
        top: 18rem;
        background: radial-gradient(circle, rgba(8, 39, 57, 0.72), transparent 66%);
      }

      body::after {
        width: 36rem;
        height: 36rem;
        right: -11rem;
        top: -7rem;
        background: radial-gradient(circle, rgba(255, 139, 87, 0.14), transparent 66%);
      }

      main {
        position: relative;
        z-index: 1;
        width: min(1240px, calc(100vw - 28px));
        margin: 0 auto;
        padding: 28px 0 72px;
      }

      h1,
      h2,
      h3,
      strong {
        margin: 0;
        font-family: "Avenir Next Condensed", "Trebuchet MS", sans-serif;
        letter-spacing: -0.04em;
      }

      p {
        margin: 0;
      }

      a {
        color: inherit;
      }

      .hero-shell,
      .workspace,
      .feature-card,
      .snippet-card,
      .empty-card,
      .console-card,
      .rail-card {
        border: 1px solid var(--line);
        background: var(--panel);
        box-shadow: var(--shadow);
        backdrop-filter: blur(18px);
      }

      .hero-shell {
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.85fr);
        gap: 24px;
        border-radius: 34px;
        padding: 26px;
        animation: rise 0.55s ease-out both;
      }

      .hero-copy {
        display: grid;
        gap: 20px;
        align-content: start;
      }

      .section-label,
      .mini-label {
        display: inline-block;
        text-transform: uppercase;
        letter-spacing: 0.16em;
      }

      .section-label {
        color: var(--teal);
        font-size: 0.78rem;
      }

      .mini-label {
        color: #ffc59d;
        font-size: 0.72rem;
      }

      .hero-copy h1 {
        max-width: 12ch;
        font-size: clamp(3rem, 7vw, 5.4rem);
        line-height: 0.92;
      }

      .hero-copy p {
        max-width: 54ch;
        color: var(--muted);
        font-size: 1.03rem;
        line-height: 1.7;
      }

      .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .meta-chip,
      .workspace-pill,
      .rail-note {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 34px;
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        font-size: 0.86rem;
      }

      .meta-chip {
        background: rgba(255, 255, 255, 0.04);
        color: var(--muted-strong);
      }

      .hero-form-shell {
        display: grid;
        gap: 14px;
        padding: 18px;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      form {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
      }

      input {
        min-width: 0;
        border: 1px solid rgba(143, 228, 255, 0.16);
        border-radius: 18px;
        padding: 16px 18px;
        font: inherit;
        color: var(--sand);
        background: rgba(4, 17, 26, 0.72);
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
      }

      input::placeholder {
        color: rgba(155, 199, 215, 0.68);
      }

      input:focus,
      button:focus,
      .copy-button:focus,
      .sample-link:focus {
        outline: 2px solid rgba(118, 215, 247, 0.45);
        outline-offset: 2px;
      }

      button,
      .copy-button,
      .sample-link {
        cursor: pointer;
        font: inherit;
      }

      button,
      .copy-button {
        border: 0;
        border-radius: 18px;
        font-weight: 700;
      }

      button {
        padding: 16px 20px;
        color: #fff8f3;
        background: linear-gradient(135deg, var(--accent) 0%, #f8a13f 100%);
        box-shadow: 0 14px 30px rgba(214, 77, 47, 0.28);
        transition: transform 180ms ease, box-shadow 180ms ease;
      }

      button:hover,
      .copy-button:hover,
      .sample-link:hover,
      .text-link:hover {
        transform: translateY(-1px);
      }

      .sample-links {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .sample-link {
        text-decoration: none;
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(118, 215, 247, 0.08);
        border: 1px solid rgba(118, 215, 247, 0.12);
        color: var(--muted-strong);
      }

      .hero-stage {
        position: relative;
        display: grid;
        align-content: space-between;
        gap: 18px;
        min-height: 100%;
        padding: 24px;
        border-radius: 28px;
        background:
          radial-gradient(circle at 18% 18%, rgba(255, 139, 87, 0.16), transparent 24%),
          linear-gradient(180deg, rgba(4, 15, 24, 0.72), rgba(4, 15, 24, 0.92));
        overflow: hidden;
      }

      .hero-stage::before,
      .hero-stage::after {
        content: "";
        position: absolute;
        border-radius: 999px;
        pointer-events: none;
      }

      .hero-stage::before {
        width: 160px;
        height: 160px;
        right: -30px;
        top: -30px;
        background: radial-gradient(circle, rgba(118, 215, 247, 0.22), transparent 68%);
        animation: drift 8s ease-in-out infinite;
      }

      .hero-stage::after {
        width: 110px;
        height: 110px;
        left: -12px;
        bottom: 16px;
        background: radial-gradient(circle, rgba(255, 139, 87, 0.24), transparent 68%);
        animation: drift 10s ease-in-out infinite reverse;
      }

      .stage-brand {
        position: relative;
        z-index: 1;
        display: grid;
        justify-items: start;
        gap: 14px;
      }

      .brand-mark {
        width: clamp(164px, 24vw, 208px);
        height: auto;
      }

      .stage-brand h2 {
        font-size: clamp(1.7rem, 3vw, 2.35rem);
      }

      .stage-brand p {
        max-width: 28ch;
        color: var(--muted);
        line-height: 1.65;
      }

      .endpoint-card {
        position: relative;
        z-index: 1;
        display: grid;
        gap: 10px;
        padding: 18px;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.045);
        border: 1px solid rgba(255, 255, 255, 0.07);
      }

      .endpoint-card code,
      .console-card code {
        display: block;
        padding: 12px 14px;
        border-radius: 16px;
        background: rgba(2, 9, 15, 0.78);
        color: #bcecff;
        font-family: "SFMono-Regular", "Menlo", monospace;
        font-size: 0.84rem;
        word-break: break-word;
      }

      .workspace {
        margin-top: 22px;
        border-radius: 30px;
        padding: 24px;
        animation: rise 0.65s ease-out both;
      }

      .status-banner {
        border-color: rgba(255, 139, 87, 0.34);
        background: linear-gradient(135deg, rgba(55, 18, 10, 0.86), rgba(10, 28, 42, 0.92));
      }

      .workspace-head,
      .stage-head,
      .rail-head,
      .snippet-card-head {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 16px;
      }

      .workspace-head {
        margin-bottom: 22px;
      }

      .workspace-head h2,
      .stage-head h2 {
        font-size: clamp(1.8rem, 3vw, 2.5rem);
      }

      .workspace-copy {
        margin-top: 10px;
        max-width: 64ch;
        color: var(--muted);
        line-height: 1.68;
      }

      .workspace-meta {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px;
      }

      .workspace-pill {
        color: var(--sand);
        background: rgba(255, 255, 255, 0.04);
      }

      .workspace-pill-muted {
        color: var(--muted);
      }

      .workspace-pill-accent {
        color: #fff4ea;
        background: rgba(255, 139, 87, 0.16);
        border-color: rgba(255, 139, 87, 0.22);
      }

      .metric-grid,
      .snippet-grid,
      .empty-grid {
        display: grid;
        gap: 16px;
      }

      .metric-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .metric-tile,
      .empty-card {
        padding: 18px;
        border-radius: 24px;
        background: var(--panel-soft);
        border: 1px solid rgba(118, 215, 247, 0.12);
      }

      .metric-tile strong {
        display: block;
        margin-top: 8px;
        font-size: clamp(1.7rem, 2vw, 2.2rem);
      }

      .metric-tile span {
        display: inline-block;
        margin-top: 8px;
        color: var(--muted);
        font-size: 0.9rem;
      }

      .display-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
        gap: 18px;
      }

      .feature-card {
        border-radius: 28px;
        padding: 20px;
      }

      .stage-card,
      .rail-group {
        display: grid;
        gap: 16px;
      }

      .card-preview {
        width: 100%;
        height: auto;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.04);
      }

      .main-card {
        padding: 10px;
        background: linear-gradient(180deg, rgba(255, 139, 87, 0.08), rgba(118, 215, 247, 0.05));
      }

      .secondary-card {
        padding: 8px;
        background: rgba(255, 255, 255, 0.03);
      }

      .rail-card {
        border-radius: 24px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.035);
      }

      .rail-stack {
        display: grid;
        gap: 10px;
        margin-top: 14px;
      }

      .rail-stack img {
        max-width: max-content;
        height: auto;
      }

      .rail-note {
        color: var(--muted);
        background: rgba(255, 255, 255, 0.03);
      }

      .snippet-grid {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      }

      .snippet-card {
        border-radius: 24px;
        padding: 18px;
        background: rgba(255, 255, 255, 0.03);
      }

      .snippet-card-head {
        margin-bottom: 14px;
      }

      .snippet-card h3,
      .empty-card h3,
      .console-card h3,
      .rail-head h3 {
        font-size: 1.3rem;
      }

      .copy-button {
        min-width: 76px;
        padding: 10px 14px;
        color: var(--sand);
        background: rgba(118, 215, 247, 0.12);
        border: 1px solid rgba(118, 215, 247, 0.16);
      }

      .copy-button.is-copied {
        color: #06202b;
        background: var(--teal);
      }

      pre {
        margin: 0;
        padding: 14px 16px;
        min-height: 148px;
        overflow-x: auto;
        border-radius: 18px;
        background: var(--code);
        color: #d5effd;
        border: 1px solid rgba(118, 215, 247, 0.1);
        font-family: "SFMono-Regular", "Menlo", monospace;
        font-size: 0.85rem;
        line-height: 1.65;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .empty-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .empty-card {
        min-height: 200px;
      }

      .empty-card-index {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 999px;
        background: rgba(255, 139, 87, 0.16);
        color: #ffd9b5;
        font-weight: 700;
      }

      .empty-card p {
        margin-top: 12px;
        color: var(--muted);
        line-height: 1.7;
      }

      .console-card {
        grid-column: span 3;
        display: grid;
        gap: 12px;
        padding: 20px;
        border-radius: 24px;
        background: linear-gradient(135deg, rgba(7, 20, 31, 0.92), rgba(9, 32, 48, 0.9));
      }

      .text-link {
        color: var(--teal);
        text-decoration: none;
      }

      @keyframes rise {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes drift {
        0%, 100% {
          transform: translate3d(0, 0, 0);
        }
        50% {
          transform: translate3d(0, 10px, 0);
        }
      }

      @media (max-width: 1080px) {
        .hero-shell,
        .display-grid {
          grid-template-columns: 1fr;
        }

        .metric-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .empty-grid {
          grid-template-columns: 1fr;
        }

        .console-card {
          grid-column: auto;
        }
      }

      @media (max-width: 720px) {
        main {
          width: min(100vw - 18px, 100%);
          padding: 16px 0 52px;
        }

        .hero-shell,
        .workspace {
          border-radius: 26px;
          padding: 18px;
        }

        .hero-copy h1,
        .workspace-head h2,
        .stage-head h2 {
          max-width: none;
          font-size: clamp(2.2rem, 12vw, 3.35rem);
        }

        form,
        .workspace-head,
        .stage-head,
        .snippet-card-head,
        .rail-head {
          grid-template-columns: 1fr;
          flex-direction: column;
        }

        button,
        .copy-button {
          width: 100%;
        }

        .metric-grid {
          grid-template-columns: 1fr;
        }

        .workspace-meta {
          justify-content: flex-start;
        }

        .rail-stack img {
          max-width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero-shell">
        <div class="hero-copy">
          <p class="section-label">ClawBadge Generator</p>
          <h1>Make README badges feel like part of the product.</h1>
          <p>Generate live ClawHub embeds from a public skill slug, preview three visual tones, and copy markdown that stays stable on the API subdomain while the root domain remains free for the future website.</p>
          <div class="hero-meta">
            <span class="meta-chip">Ocean registry palette</span>
            <span class="meta-chip">Live SVG badges</span>
            <span class="meta-chip">Card + markdown studio</span>
          </div>
          <div class="hero-form-shell">
            <form id="slug-form">
              <input id="slug-input" name="slug" value="${escapeXml(defaultSlug)}" placeholder="free-ride" autocomplete="off" spellcheck="false" />
              <button type="submit">Generate</button>
            </form>
            <div class="sample-links">
              <a class="sample-link" href="/generate/free-ride">Try free-ride</a>
              <a class="sample-link" href="/api/health">Check API health</a>
              <a class="sample-link" href="/badge/free-ride/downloads.svg">Open a sample badge</a>
            </div>
          </div>
        </div>
        <aside class="hero-stage">
          <div class="stage-brand">
            ${renderBrandMark()}
            <div>
              <p class="section-label">Lobster deck</p>
              <h2>Deep-sea badge workshop.</h2>
            </div>
            <p>OpenClaw and ClawHub already lean into this lobster/ocean identity. The generator should feel like the same family, just tuned for embeds and launch assets.</p>
          </div>
          <div class="endpoint-card">
            <p class="section-label">Stable host</p>
            <code>${escapeXml(`${origin}/api/skills/free-ride`)}</code>
            <code>${escapeXml(`${origin}/badge/free-ride/card.svg?theme=flat`)}</code>
            <code>${escapeXml(`${origin}/generate/free-ride`)}</code>
          </div>
        </aside>
      </section>
      ${errorSection}
      ${contentSection}
    </main>
    <script>
      const form = document.getElementById("slug-form");
      const input = document.getElementById("slug-input");
      const copyButtons = Array.from(document.querySelectorAll("[data-copy-target]"));

      form?.addEventListener("submit", (event) => {
        event.preventDefault();
        const slug = input?.value?.trim();
        if (!slug) return;
        window.location.href = "/generate/" + encodeURIComponent(slug);
      });

      for (const button of copyButtons) {
        button.addEventListener("click", async () => {
          const targetId = button.getAttribute("data-copy-target");
          const target = targetId ? document.getElementById(targetId) : null;
          if (!target) return;

          const text = target.textContent || "";

          try {
            await navigator.clipboard.writeText(text);
            const previous = button.textContent;
            button.textContent = "Copied";
            button.classList.add("is-copied");
            window.setTimeout(() => {
              button.textContent = previous || "Copy";
              button.classList.remove("is-copied");
            }, 1400);
          } catch {
            button.textContent = "Select text";
          }
        });
      }
    </script>
  </body>
</html>`;
}
