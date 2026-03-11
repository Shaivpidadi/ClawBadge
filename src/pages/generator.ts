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
  title: string;
  eyebrow: string;
  snippet: string;
  note: string;
  previewHref?: string;
};

type ThemeOption = "default" | "dark" | "flat";

function buildThemeQuery(theme: ThemeOption, extraParams: string[] = []): string {
  const params = theme === "default" ? [...extraParams] : [`theme=${theme}`, ...extraParams];
  return params.length > 0 ? `?${params.join("&")}` : "";
}

function buildMarkdown(origin: string, slug: string, theme: ThemeOption): MarkdownSnippets {
  const skillUrl = `https://clawhub.ai/skills/${slug}`;
  const badgeBase = `${origin}/badge/${slug}`;
  const themeQuery = buildThemeQuery(theme);
  const cardQuery = buildThemeQuery(theme, ["showOwner=1", "showUpdated=1"]);

  return {
    downloads: `[![ClawHub Downloads](${badgeBase}/downloads.svg${themeQuery})](${skillUrl})`,
    multi: [
      `[![ClawHub Downloads](${badgeBase}/downloads.svg${themeQuery})](${skillUrl})`,
      `[![ClawHub Current Installs](${badgeBase}/installs-current.svg${themeQuery})](${skillUrl})`,
      `[![ClawHub Stars](${badgeBase}/stars.svg${themeQuery})](${skillUrl})`,
      `[![ClawHub Version](${badgeBase}/version.svg${themeQuery})](${skillUrl})`
    ].join("\n"),
    card: `[![ClawHub Card](${badgeBase}/card.svg${cardQuery})](${skillUrl})`
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

function renderCopyButton(text: string, label: string, caption = "Copy"): string {
  return `<button class="copy-button" type="button" data-copy-text="${escapeXml(text)}" data-copy-label="${escapeXml(label)}">${escapeXml(caption)}</button>`;
}

function renderSnippetBlock({ title, eyebrow, snippet, note, previewHref }: SnippetBlock): string {
  return `<section class="snippet-card">
    <div class="snippet-card-head">
      <div>
        <p class="mini-label">${escapeXml(eyebrow)}</p>
        <h3>${escapeXml(title)}</h3>
        <p class="snippet-note">${escapeXml(note)}</p>
      </div>
      <div class="snippet-actions">
        ${renderCopyButton(snippet, `${title} markdown`)}
        ${previewHref ? `<a class="text-link snippet-link" href="${escapeXml(previewHref)}" target="_blank" rel="noreferrer">Preview</a>` : ""}
      </div>
    </div>
    <pre class="copy-surface" tabindex="0" role="button" data-copy-text="${escapeXml(snippet)}" data-copy-label="${escapeXml(title)} markdown">${escapeXml(snippet)}</pre>
  </section>`;
}

function renderCardTile(origin: string, slug: string, theme: ThemeOption, title: string, note: string, snippet: string): string {
  const query = buildThemeQuery(theme, ["showOwner=1", "showUpdated=1"]);
  const href = `${origin}/badge/${slug}/card.svg${query}`;

  return `<article class="asset-tile card-tile">
    <div class="asset-head">
      <div>
        <p class="mini-label">Card</p>
        <h3>${escapeXml(title)}</h3>
        <p class="asset-note">${escapeXml(note)}</p>
      </div>
      ${renderCopyButton(snippet, `${title} card markdown`, "Copy markdown")}
    </div>
    <a class="card-frame" href="${escapeXml(href)}" target="_blank" rel="noreferrer">
      <img class="card-preview" src="${escapeXml(href)}" alt="${escapeXml(title)} ClawHub summary card" />
    </a>
    <div class="asset-foot">
      <a class="text-link" href="${escapeXml(href)}" target="_blank" rel="noreferrer">Open SVG</a>
    </div>
  </article>`;
}

function renderBadgeThemeRow(origin: string, slug: string, theme: ThemeOption, title: string, note: string, snippet: string): string {
  const suffix = buildThemeQuery(theme);
  const openHref = `${origin}/badge/${slug}/downloads.svg${suffix}`;

  return `<article class="theme-row">
    <div class="theme-row-head">
      <div>
        <p class="mini-label">${escapeXml(theme)} badge row</p>
        <h3>${escapeXml(title)}</h3>
        <p class="asset-note">${escapeXml(note)}</p>
      </div>
      <div class="theme-actions">
        ${renderCopyButton(snippet, `${title} markdown`, "Copy row")}
        <a class="text-link" href="${escapeXml(openHref)}" target="_blank" rel="noreferrer">Open SVG</a>
      </div>
    </div>
    <div class="badge-lane">
      <img src="${escapeXml(`${origin}/badge/${slug}/downloads.svg${suffix}`)}" alt="Downloads badge ${escapeXml(theme)}" />
      <img src="${escapeXml(`${origin}/badge/${slug}/installs-current.svg${suffix}`)}" alt="Current installs badge ${escapeXml(theme)}" />
      <img src="${escapeXml(`${origin}/badge/${slug}/stars.svg${suffix}`)}" alt="Stars badge ${escapeXml(theme)}" />
      <img src="${escapeXml(`${origin}/badge/${slug}/version.svg${suffix}`)}" alt="Version badge ${escapeXml(theme)}" />
    </div>
  </article>`;
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
        <span>${escapeXml(`Badge reads ${tile.accent}`)}</span>
      </article>`
    )
    .join("");
}

function renderEmptyState(origin: string): string {
  return `<section class="workspace empty-workspace">
    <div class="workspace-head">
      <div>
        <p class="section-label">1. Pick a skill</p>
        <h2>Start with a public ClawHub slug.</h2>
        <p class="workspace-copy">Click <strong>Try demo skill</strong> above to see live previews, or enter any public ClawHub slug.</p>
      </div>
      <span class="workspace-pill">${escapeXml(origin)}</span>
    </div>
    <div class="empty-grid">
      <article class="empty-card">
        <span class="step-index">1</span>
        <h3>Enter a slug</h3>
        <p>Paste any public ClawHub skill slug into the field above.</p>
      </article>
      <article class="empty-card">
        <span class="step-index">2</span>
        <h3>Review the assets</h3>
        <p>Check the card themes and badge rows rendered from live skill data.</p>
      </article>
      <article class="empty-card">
        <span class="step-index">3</span>
        <h3>Copy the markdown</h3>
        <p>Use the copy buttons or click the code blocks to move embeds into your README.</p>
      </article>
      <article class="console-card">
        <p class="section-label">What you get</p>
        <code>${escapeXml(origin)}/badge/my-skill/downloads.svg</code>
        <code>${escapeXml(origin)}/badge/my-skill/card.svg?theme=flat</code>
        <code>${escapeXml(origin)}/generate/my-skill</code>
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
      title: "Single badge",
      eyebrow: "Quick copy",
      snippet: defaultMarkdown.downloads,
      note: "Use one compact metric at the top of a README.",
      previewHref: `${origin}/badge/${skill.slug}/downloads.svg`
    },
    {
      title: "Default badge row",
      eyebrow: "Quick copy",
      snippet: defaultMarkdown.multi,
      note: "The standard four-badge line for most README layouts.",
      previewHref: `${origin}/badge/${skill.slug}/downloads.svg`
    },
    {
      title: "Summary card",
      eyebrow: "Quick copy",
      snippet: flatMarkdown.card,
      note: "Larger embed with summary, owner, and headline metrics.",
      previewHref: `${origin}/badge/${skill.slug}/card.svg?theme=flat&showOwner=1&showUpdated=1`
    }
  ];

  return `<section class="workspace skill-workspace">
      <div class="workspace-head">
        <div>
          <p class="section-label">1. Skill</p>
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
    <section class="workspace asset-workspace">
      <div class="workspace-head">
        <div>
          <p class="section-label">2. Preview assets</p>
          <h2>Choose the SVG you want to ship.</h2>
          <p class="workspace-copy">Card previews and badge rows below are the exact assets served from this host.</p>
        </div>
        <a class="workspace-link" href="${escapeXml(`https://clawhub.ai/skills/${skill.slug}`)}" target="_blank" rel="noreferrer">Open on ClawHub</a>
      </div>
      <div class="asset-grid">
        <section class="feature-card card-panel">
          <div class="section-stack">
            <p class="section-label">Card themes</p>
            <h3>Summary cards</h3>
          </div>
          <div class="card-grid">
            ${renderCardTile(origin, skill.slug, "flat", "Flat", "Warm branded card for light README sections.", flatMarkdown.card)}
            ${renderCardTile(origin, skill.slug, "default", "Default", "Neutral light card with the standard palette.", defaultMarkdown.card)}
            ${renderCardTile(origin, skill.slug, "dark", "Dark", "Best when the surrounding section is dark.", darkMarkdown.card)}
          </div>
        </section>
        <section class="feature-card badge-panel">
          <div class="section-stack">
            <p class="section-label">Badge rows</p>
            <h3>README badge lines</h3>
          </div>
          <div class="theme-list">
            ${renderBadgeThemeRow(origin, skill.slug, "default", "Default", "Best starting point for most README backgrounds.", defaultMarkdown.multi)}
            ${renderBadgeThemeRow(origin, skill.slug, "dark", "Dark", "Higher contrast for dark README sections.", darkMarkdown.multi)}
            ${renderBadgeThemeRow(origin, skill.slug, "flat", "Flat", "Warm ClawHub tone with the lobster accent.", flatMarkdown.multi)}
          </div>
        </section>
      </div>
    </section>
    <section class="workspace snippet-workspace">
      <div class="workspace-head">
        <div>
          <p class="section-label">3. Copy markdown</p>
          <h2>Paste the final embed into your README.</h2>
          <p class="workspace-copy">Every block below is clickable, and each action copies the exact markdown shown.</p>
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
        --panel: rgba(8, 22, 34, 0.9);
        --panel-soft: rgba(11, 31, 45, 0.76);
        --line: rgba(143, 228, 255, 0.16);
        --text: #f5ecd7;
        --muted: #9bc7d7;
        --muted-strong: #d7f3ff;
        --accent: #ff8b57;
        --teal: #76d7f7;
        --sand: #fff3dd;
        --code: #07141f;
        --shadow: 0 18px 38px rgba(0, 0, 0, 0.26);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        color: var(--text);
        font-family: "Avenir Next", "Trebuchet MS", sans-serif;
        background:
          radial-gradient(circle at 14% 12%, rgba(255, 139, 87, 0.14), transparent 20%),
          radial-gradient(circle at 82% 14%, rgba(118, 215, 247, 0.12), transparent 18%),
          linear-gradient(180deg, #082030 0%, var(--bg) 46%, var(--bg-deep) 100%);
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
        width: 30rem;
        height: 30rem;
        left: -14rem;
        top: 18rem;
        background: radial-gradient(circle, rgba(8, 39, 57, 0.48), transparent 66%);
      }

      body::after {
        width: 24rem;
        height: 24rem;
        right: -11rem;
        top: -7rem;
        background: radial-gradient(circle, rgba(255, 139, 87, 0.1), transparent 66%);
      }

      main {
        position: relative;
        z-index: 1;
        width: min(1180px, calc(100vw - 28px));
        margin: 0 auto;
        padding: 20px 0 44px;
      }

      h1,
      h2,
      h3,
      strong {
        margin: 0;
        font-family: "Palatino Linotype", "Book Antiqua", Georgia, serif;
        letter-spacing: -0.03em;
      }

      p {
        margin: 0;
      }

      a {
        color: inherit;
      }

      code {
        font-family: "SFMono-Regular", "Menlo", monospace;
      }

      .hero-shell,
      .workspace,
      .feature-card,
      .snippet-card,
      .console-card,
      .empty-card,
      .theme-row,
      .asset-tile {
        border: 1px solid var(--line);
        background: var(--panel);
        box-shadow: var(--shadow);
        backdrop-filter: blur(14px);
      }

      .hero-shell {
        display: grid;
        gap: 16px;
        border-radius: 24px;
        padding: 18px;
      }

      .hero-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }

      .hero-brand {
        display: flex;
        gap: 14px;
        align-items: flex-start;
      }

      .hero-brand-copy {
        display: grid;
        gap: 8px;
      }

      .section-label,
      .mini-label {
        display: inline-block;
        text-transform: uppercase;
        letter-spacing: 0.16em;
      }

      .section-label {
        color: var(--teal);
        font-size: 0.74rem;
      }

      .mini-label {
        color: #ffc59d;
        font-size: 0.68rem;
      }

      .hero-brand-copy h1 {
        max-width: 13ch;
        font-size: clamp(2rem, 4.1vw, 3rem);
        line-height: 0.98;
      }

      .hero-brand-copy p {
        max-width: 62ch;
        color: var(--muted);
        font-size: 0.96rem;
        line-height: 1.5;
      }

      .brand-mark {
        width: 82px;
        height: auto;
      }

      .workspace-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 30px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        font-size: 0.8rem;
      }

      .host-badge {
        display: grid;
        gap: 6px;
        min-width: 230px;
        padding: 14px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .host-badge code,
      .console-card code {
        display: block;
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(2, 9, 15, 0.78);
        color: #bcecff;
        font-size: 0.8rem;
        word-break: break-word;
      }

      .hero-controls {
        display: grid;
        gap: 12px;
      }

      form {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
      }

      input {
        min-width: 0;
        border: 1px solid rgba(143, 228, 255, 0.16);
        border-radius: 14px;
        padding: 14px 16px;
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
      .sample-link:focus,
      .copy-surface:focus {
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
        border-radius: 14px;
        font-weight: 700;
      }

      button {
        padding: 14px 18px;
        color: #fff8f3;
        background: linear-gradient(135deg, var(--accent) 0%, #f8a13f 100%);
        box-shadow: 0 10px 22px rgba(214, 77, 47, 0.22);
        transition: transform 180ms ease, box-shadow 180ms ease;
      }

      button:hover,
      .copy-button:hover,
      .sample-link:hover,
      .text-link:hover,
      .workspace-link:hover,
      .snippet-link:hover {
        transform: translateY(-1px);
      }

      .sample-links {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .sample-link {
        text-decoration: none;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(118, 215, 247, 0.08);
        border: 1px solid rgba(118, 215, 247, 0.12);
        color: var(--muted-strong);
        font-size: 0.88rem;
      }

      .hero-guides {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .guide-chip {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .guide-number,
      .step-index {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        width: 26px;
        height: 26px;
        border-radius: 999px;
        background: rgba(255, 139, 87, 0.16);
        color: #ffd9b5;
        font-size: 0.82rem;
        font-weight: 700;
      }

      .guide-chip strong {
        display: block;
        font-family: "Avenir Next", "Trebuchet MS", sans-serif;
        letter-spacing: 0;
      }

      .guide-chip span:last-child,
      .empty-card p {
        color: var(--muted);
        line-height: 1.5;
      }

      .workspace {
        margin-top: 14px;
        border-radius: 24px;
        padding: 16px;
      }

      .status-banner {
        border-color: rgba(255, 139, 87, 0.34);
        background: linear-gradient(135deg, rgba(55, 18, 10, 0.86), rgba(10, 28, 42, 0.92));
      }

      .workspace-head,
      .snippet-card-head {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 12px;
      }

      .workspace-head {
        margin-bottom: 12px;
      }

      .workspace-head h2,
      .section-stack h3 {
        font-size: clamp(1.45rem, 2.4vw, 1.95rem);
      }

      .workspace-copy {
        margin-top: 6px;
        max-width: 64ch;
        color: var(--muted);
        line-height: 1.56;
      }

      .workspace-copy code {
        color: var(--muted-strong);
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
      .empty-grid,
      .asset-grid,
      .card-grid,
      .theme-list,
      .section-stack,
      .asset-tile {
        display: grid;
        gap: 14px;
      }

      .metric-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .metric-tile,
      .empty-card {
        padding: 12px;
        border-radius: 18px;
        background: var(--panel-soft);
        border: 1px solid rgba(118, 215, 247, 0.12);
      }

      .empty-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .empty-card {
        align-content: start;
      }

      .metric-tile strong {
        display: block;
        margin-top: 6px;
        font-size: clamp(1.45rem, 1.9vw, 1.9rem);
      }

      .metric-tile span {
        display: inline-block;
        margin-top: 6px;
        color: var(--muted);
        font-size: 0.84rem;
      }

      .console-card {
        grid-column: 1 / -1;
        display: grid;
        gap: 10px;
        padding: 16px;
        border-radius: 18px;
        background: linear-gradient(135deg, rgba(7, 20, 31, 0.92), rgba(9, 32, 48, 0.9));
      }

      .feature-card {
        border-radius: 22px;
        padding: 14px;
      }

      .card-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .asset-head,
      .theme-row-head,
      .theme-actions,
      .snippet-actions,
      .asset-foot {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .asset-head,
      .theme-row-head {
        justify-content: space-between;
        align-items: start;
      }

      .asset-note,
      .snippet-note {
        margin-top: 4px;
        color: var(--muted);
        font-size: 0.9rem;
        line-height: 1.45;
      }

      .asset-tile,
      .theme-row {
        padding: 12px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.03);
      }

      .card-frame {
        display: block;
        padding: 10px;
        border-radius: 18px;
        background: linear-gradient(180deg, rgba(255, 139, 87, 0.08), rgba(118, 215, 247, 0.05));
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .card-preview {
        display: block;
        width: 100%;
        height: auto;
        border-radius: 16px;
      }

      .theme-list {
        gap: 12px;
      }

      .badge-lane {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 12px;
        border-radius: 16px;
        background: var(--code);
        border: 1px solid rgba(118, 215, 247, 0.1);
      }

      .badge-lane img {
        display: block;
        width: auto;
        height: 28px;
      }

      .snippet-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .snippet-card {
        border-radius: 18px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
      }

      .snippet-card-head {
        margin-bottom: 10px;
      }

      .snippet-card h3,
      .empty-card h3,
      .console-card h3,
      .theme-row h3,
      .asset-tile h3 {
        font-size: 1.08rem;
      }

      .copy-button {
        min-width: 96px;
        padding: 9px 12px;
        color: var(--sand);
        background: rgba(118, 215, 247, 0.12);
        border: 1px solid rgba(118, 215, 247, 0.16);
        font-size: 0.84rem;
      }

      .copy-button.is-copied {
        color: #06202b;
        background: var(--teal);
      }

      pre {
        margin: 0;
        padding: 12px 14px;
        min-height: 88px;
        max-height: 196px;
        overflow: auto;
        border-radius: 14px;
        background: var(--code);
        color: #d5effd;
        border: 1px solid rgba(118, 215, 247, 0.1);
        font-size: 0.82rem;
        line-height: 1.55;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .copy-surface {
        cursor: pointer;
        transition: border-color 160ms ease, background 160ms ease;
      }

      .copy-surface:hover {
        border-color: rgba(118, 215, 247, 0.28);
        background: rgba(5, 18, 28, 0.94);
      }

      .text-link {
        color: var(--teal);
        text-decoration: none;
      }

      .workspace-link,
      .snippet-link {
        display: inline-flex;
        align-items: center;
        min-height: 36px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid rgba(118, 215, 247, 0.16);
        background: rgba(118, 215, 247, 0.08);
        text-decoration: none;
      }

      .copy-toast {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 4;
        min-width: 180px;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid rgba(118, 215, 247, 0.2);
        background: rgba(5, 19, 29, 0.96);
        color: var(--sand);
        box-shadow: var(--shadow);
        opacity: 0;
        transform: translateY(8px);
        pointer-events: none;
        transition: opacity 160ms ease, transform 160ms ease;
      }

      .copy-toast.is-visible {
        opacity: 1;
        transform: translateY(0);
      }

      .copy-toast.is-error {
        border-color: rgba(255, 139, 87, 0.24);
        color: #ffe3cf;
      }

      @media (max-width: 1080px) {
        .hero-top,
        .workspace-head,
        .asset-head,
        .theme-row-head {
          flex-direction: column;
        }

        .host-badge {
          min-width: 0;
          width: 100%;
        }

        .hero-guides,
        .card-grid,
        .snippet-grid,
        .empty-grid {
          grid-template-columns: 1fr;
        }

        .metric-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .workspace-meta {
          justify-content: flex-start;
        }
      }

      @media (max-width: 720px) {
        main {
          width: min(100vw - 18px, 100%);
          padding: 14px 0 40px;
        }

        .hero-shell,
        .workspace {
          border-radius: 22px;
          padding: 14px;
        }

        .hero-brand {
          flex-direction: column;
        }

        .hero-brand-copy h1,
        .workspace-head h2,
        .section-stack h3 {
          max-width: none;
          font-size: clamp(1.9rem, 11vw, 2.65rem);
        }

        form {
          grid-template-columns: 1fr;
        }

        .workspace-head,
        .snippet-card-head,
        .asset-head,
        .theme-row-head {
          flex-direction: column;
        }

        button,
        .copy-button {
          width: 100%;
        }

        .metric-grid {
          grid-template-columns: 1fr;
        }

        .badge-lane img {
          height: 24px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero-shell">
        <div class="hero-top">
          <div class="hero-brand">
            ${renderBrandMark()}
            <div class="hero-brand-copy">
              <p class="section-label">ClawBadge Generator</p>
              <h1>Generate README embeds for ClawHub skills.</h1>
              <p>Enter a public slug, review the live SVG previews, then copy the markdown you actually want to ship.</p>
            </div>
          </div>
          <div class="host-badge">
            <p class="section-label">API host</p>
            <code>${escapeXml(origin)}</code>
          </div>
        </div>
        <div class="hero-controls">
          <form id="slug-form">
            <input id="slug-input" name="slug" value="${escapeXml(defaultSlug)}" placeholder="my-skill" autocomplete="off" spellcheck="false" />
            <button type="submit">Load skill</button>
          </form>
          <div class="sample-links">
            <a class="sample-link" href="/generate/free-ride">Try demo skill</a>
            <a class="sample-link" href="/api/health">Check API health</a>
            <a class="sample-link" href="/badge/free-ride/downloads.svg">Open a sample badge</a>
          </div>
          <div class="hero-guides">
            <article class="guide-chip">
              <span class="guide-number">1</span>
              <span><strong>Load a public skill</strong> Paste any ClawHub slug to fetch live data.</span>
            </article>
            <article class="guide-chip">
              <span class="guide-number">2</span>
              <span><strong>Inspect the SVG previews</strong> Check the card themes and badge rows before copying.</span>
            </article>
            <article class="guide-chip">
              <span class="guide-number">3</span>
              <span><strong>Copy markdown</strong> Use the buttons or click the code blocks directly.</span>
            </article>
          </div>
        </div>
      </section>
      ${errorSection}
      ${contentSection}
    </main>
    <div class="copy-toast" id="copy-toast" role="status" aria-live="polite"></div>
    <script>
      const form = document.getElementById("slug-form");
      const input = document.getElementById("slug-input");
      const copyTargets = Array.from(document.querySelectorAll("[data-copy-text]"));
      const copyToast = document.getElementById("copy-toast");
      let copyToastTimer = 0;

      const showCopyToast = (message, isError = false) => {
        if (!copyToast) return;
        copyToast.textContent = message;
        copyToast.classList.toggle("is-error", isError);
        copyToast.classList.add("is-visible");
        window.clearTimeout(copyToastTimer);
        copyToastTimer = window.setTimeout(() => {
          copyToast.classList.remove("is-visible");
          copyToast.classList.remove("is-error");
        }, 1600);
      };

      const selectElementText = (element) => {
        const selection = window.getSelection();
        if (!selection) return;
        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
      };

      const runCopy = async (element, button) => {
        const text = element.getAttribute("data-copy-text") || "";
        const label = element.getAttribute("data-copy-label") || "Snippet";
        if (!text) return;

        try {
          await navigator.clipboard.writeText(text);
          if (button) {
            const previous = button.textContent;
            button.textContent = "Copied";
            button.classList.add("is-copied");
            window.setTimeout(() => {
              button.textContent = previous || "Copy";
              button.classList.remove("is-copied");
            }, 1200);
          }
          showCopyToast(label + " copied");
        } catch {
          selectElementText(element);
          showCopyToast("Clipboard blocked. Press Cmd/Ctrl+C.", true);
        }
      };

      form?.addEventListener("submit", (event) => {
        event.preventDefault();
        const slug = input?.value?.trim();
        if (!slug) return;
        window.location.href = "/generate/" + encodeURIComponent(slug);
      });

      for (const element of copyTargets) {
        element.addEventListener("click", async (event) => {
          const target = event.currentTarget;
          if (!(target instanceof HTMLElement)) return;
          if (target.matches("button")) {
            await runCopy(target, target);
            return;
          }
          await runCopy(target);
        });

        element.addEventListener("keydown", async (event) => {
          const target = event.currentTarget;
          if (!(target instanceof HTMLElement)) return;
          if (target.matches("button")) return;
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          await runCopy(target);
        });
      }
    </script>
  </body>
</html>`;
}
