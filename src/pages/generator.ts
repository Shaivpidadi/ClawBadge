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
        <stop offset="0%" stop-color="#06b6d4" />
        <stop offset="100%" stop-color="#0891b2" />
      </linearGradient>
      <linearGradient id="brand-panel" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#1e293b" />
      </linearGradient>
      <linearGradient id="brand-belly" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stop-color="#e2e8f0" />
        <stop offset="100%" stop-color="#f8fafc" />
      </linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect x="24" y="16" width="212" height="188" rx="44" fill="url(#brand-panel)" />
    <rect x="39" y="31" width="182" height="158" rx="34" fill="#020617" stroke="rgba(6, 182, 212, 0.2)" stroke-width="1" />
    <circle cx="76" cy="68" r="32" fill="url(#brand-shell)" filter="url(#glow)" />
    <circle cx="184" cy="68" r="32" fill="url(#brand-shell)" filter="url(#glow)" />
    <circle cx="89" cy="70" r="12" fill="#020617" />
    <circle cx="171" cy="70" r="12" fill="#020617" />
    <path d="M65 41c11-11 25-17 40-18" fill="none" stroke="#22d3ee" stroke-linecap="round" stroke-width="4" opacity="0.7" />
    <path d="M195 41c-11-11-25-17-40-18" fill="none" stroke="#22d3ee" stroke-linecap="round" stroke-width="4" opacity="0.7" />
    <rect x="109" y="82" width="42" height="60" rx="21" fill="url(#brand-belly)" />
    <rect x="96" y="112" width="68" height="16" rx="8" fill="#06b6d4" />
    <rect x="84" y="141" width="92" height="18" rx="9" fill="#0891b2" />
    <rect x="95" y="165" width="70" height="11" rx="5.5" fill="#0e7490" />
    <circle cx="64" cy="116" r="8" fill="#0e7490" />
    <circle cx="196" cy="116" r="8" fill="#0e7490" />
    <circle cx="130" cy="52" r="8" fill="#f8fafc" />
  </svg>`;
}

function renderCopyButton(text: string, label: string, caption = "Copy"): string {
  return `<button class="copy-button" type="button" data-copy-text="${escapeXml(text)}" data-copy-label="${escapeXml(label)}">${escapeXml(caption)}</button>`;
}

function renderSnippetBlock({ title, eyebrow, snippet, note, previewHref }: SnippetBlock): string {
  return `<article class="snippet-card">
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
  </article>`;
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
      accent: compactNumber(skill.downloads),
      highlight: true
    },
    {
      label: "Installed now",
      value: formatInteger(skill.installsCurrent),
      accent: compactNumber(skill.installsCurrent),
      highlight: false
    },
    {
      label: "Installed ever",
      value: formatInteger(skill.installsAllTime),
      accent: compactNumber(skill.installsAllTime),
      highlight: false
    },
    {
      label: "Stars",
      value: formatInteger(skill.stars),
      accent: compactNumber(skill.stars),
      highlight: false
    }
  ];

  return tiles
    .map(
      (tile, index) => `<article class="metric-tile${tile.highlight ? " metric-tile--highlight" : ""}" style="--delay: ${index * 0.1}s">
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
        <p class="section-label">Getting Started</p>
        <h2>Start with a public ClawHub slug.</h2>
        <p class="workspace-copy">Click <strong>Try demo skill</strong> above to see live previews, or enter any public ClawHub slug.</p>
      </div>
      <span class="workspace-pill">${escapeXml(origin)}</span>
    </div>
    <div class="empty-grid">
      <article class="empty-card" style="--offset: 0px">
        <span class="step-index">1</span>
        <h3>Enter a slug</h3>
        <p>Paste any public ClawHub skill slug into the field above.</p>
      </article>
      <article class="empty-card" style="--offset: -24px">
        <span class="step-index">2</span>
        <h3>Review the assets</h3>
        <p>Check the card themes and badge rows rendered from live skill data.</p>
      </article>
      <article class="empty-card" style="--offset: 12px">
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
          <p class="section-label">Skill Preview</p>
          <h2>${escapeXml(skill.displayName)}</h2>
          <p class="workspace-copy">${escapeXml(summary)}</p>
        </div>
        <div class="workspace-meta">
          <span class="workspace-pill workspace-pill-accent">${escapeXml(skill.slug)}</span>
          <span class="workspace-pill">${escapeXml(descriptor)}</span>
          <span class="workspace-pill">${escapeXml(`Updated ${updated}`)}</span>
          <span class="workspace-pill workspace-pill-version">${escapeXml(formatVersion(skill.version))}</span>
        </div>
      </div>
      <div class="metric-grid">
        ${renderMetricTiles(skill)}
      </div>
    </section>
    <section class="workspace asset-workspace">
      <div class="workspace-head">
        <div>
          <p class="section-label">Preview Assets</p>
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
          <p class="section-label">Copy Markdown</p>
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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
    <style>
      :root {
        color-scheme: dark;
        --bg: #020617;
        --bg-elevated: #0f172a;
        --surface: rgba(15, 23, 42, 0.8);
        --surface-elevated: rgba(30, 41, 59, 0.6);
        --border: rgba(148, 163, 184, 0.1);
        --border-strong: rgba(148, 163, 184, 0.2);
        --text: #f8fafc;
        --text-secondary: #94a3b8;
        --text-tertiary: #64748b;
        --accent: #06b6d4;
        --accent-soft: rgba(6, 182, 212, 0.15);
        --accent-glow: rgba(6, 182, 212, 0.4);
        --code-bg: #0c0f1a;
        --shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.4);
        --shadow-lg: 0 32px 64px -16px rgba(0, 0, 0, 0.5);
        --radius: 16px;
        --radius-sm: 10px;
        --radius-lg: 24px;
      }

      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-12px) rotate(1deg); }
      }

      @keyframes pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }

      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
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
        font-family: "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
        font-size: 15px;
        line-height: 1.6;
        background: var(--bg);
        overflow-x: hidden;
        -webkit-font-smoothing: antialiased;
      }

      /* Background Effects */
      .bg-wrapper {
        position: fixed;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 0;
      }

      .bg-grid {
        position: absolute;
        inset: 0;
        background-image: 
          linear-gradient(rgba(148, 163, 184, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.03) 1px, transparent 1px);
        background-size: 48px 48px;
        mask-image: radial-gradient(ellipse 70% 50% at 50% 0%, black 30%, transparent 80%);
      }

      .bg-glow {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
      }

      .bg-glow--primary {
        width: 600px;
        height: 600px;
        left: -200px;
        top: -100px;
        background: radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%);
        animation: pulse 8s ease-in-out infinite;
      }

      .bg-glow--secondary {
        width: 500px;
        height: 500px;
        right: -100px;
        top: 30%;
        background: radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%);
        animation: pulse 10s ease-in-out infinite 2s;
      }

      .bg-glow--tertiary {
        width: 400px;
        height: 400px;
        left: 40%;
        bottom: -100px;
        background: radial-gradient(circle, rgba(148, 163, 184, 0.05) 0%, transparent 70%);
      }

      main {
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 1320px;
        margin: 0 auto;
        padding: 40px 24px 100px;
      }

      h1, h2, h3, strong {
        margin: 0;
        font-family: "Space Grotesk", -apple-system, sans-serif;
        font-weight: 600;
        letter-spacing: -0.025em;
        color: var(--text);
      }

      p { margin: 0; }
      a { color: inherit; }

      code {
        font-family: "SF Mono", "Fira Code", "Monaco", "Consolas", monospace;
        font-size: 0.9em;
      }

      /* Hero Section - Asymmetric Two Column */
      .hero {
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        gap: 48px;
        align-items: start;
        margin-bottom: 48px;
        padding: 48px;
        border-radius: var(--radius-lg);
        background: var(--surface);
        border: 1px solid var(--border);
        box-shadow: var(--shadow-lg);
        backdrop-filter: blur(20px);
        position: relative;
        overflow: hidden;
        animation: fadeUp 0.6s ease-out;
      }

      .hero::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, transparent 50%);
        pointer-events: none;
      }

      .hero::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--accent), transparent);
        opacity: 0.6;
      }

      .hero__content {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 32px;
      }

      .hero__brand {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .brand-mark {
        width: 88px;
        height: auto;
        filter: drop-shadow(0 8px 24px var(--accent-glow));
        animation: float 6s ease-in-out infinite;
      }

      .hero__title {
        font-size: clamp(2.5rem, 5vw, 3.5rem);
        line-height: 1.1;
        max-width: 16ch;
        background: linear-gradient(135deg, var(--text) 0%, var(--text-secondary) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .hero__description {
        max-width: 50ch;
        color: var(--text-secondary);
        font-size: 1.1rem;
        line-height: 1.7;
      }

      .section-label {
        display: inline-block;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        font-weight: 600;
        font-size: 0.7rem;
        color: var(--accent);
      }

      .mini-label {
        display: inline-block;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-weight: 500;
        font-size: 0.65rem;
        color: var(--text-tertiary);
      }

      /* Steps - Asymmetric Stagger */
      .hero__steps {
        display: grid;
        grid-template-columns: 1.1fr 1fr 0.9fr;
        gap: 16px;
        margin-top: 8px;
      }

      .step-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 20px;
        border-radius: var(--radius);
        background: var(--surface-elevated);
        border: 1px solid var(--border);
        transition: all 0.3s ease;
      }

      .step-card:nth-child(1) { transform: translateY(0); }
      .step-card:nth-child(2) { transform: translateY(16px); }
      .step-card:nth-child(3) { transform: translateY(32px); }

      .step-card:hover {
        border-color: var(--border-strong);
        box-shadow: var(--shadow);
      }

      .step-card:nth-child(1):hover { transform: translateY(-4px); }
      .step-card:nth-child(2):hover { transform: translateY(12px); }
      .step-card:nth-child(3):hover { transform: translateY(28px); }

      .step-index {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: var(--radius-sm);
        background: var(--accent-soft);
        color: var(--accent);
        font-family: "Space Grotesk", sans-serif;
        font-weight: 700;
        font-size: 0.85rem;
      }

      .step-card strong {
        display: block;
        font-size: 0.95rem;
        margin-bottom: 2px;
      }

      .step-card p {
        color: var(--text-tertiary);
        font-size: 0.85rem;
        line-height: 1.5;
      }

      /* Hero Sidebar */
      .hero__sidebar {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .host-badge {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 20px;
        border-radius: var(--radius);
        background: var(--bg-elevated);
        border: 1px solid var(--border);
      }

      .host-badge code {
        display: block;
        padding: 14px 16px;
        border-radius: var(--radius-sm);
        background: var(--code-bg);
        color: var(--accent);
        font-size: 0.85rem;
        word-break: break-all;
        border: 1px solid var(--border);
      }

      .hero__form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      input {
        width: 100%;
        padding: 16px 20px;
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-sm);
        font: inherit;
        font-size: 1rem;
        color: var(--text);
        background: var(--code-bg);
        transition: all 0.2s ease;
      }

      input::placeholder {
        color: var(--text-tertiary);
      }

      input:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-soft);
      }

      button {
        width: 100%;
        padding: 16px 24px;
        border: none;
        border-radius: var(--radius-sm);
        font: inherit;
        font-weight: 600;
        font-size: 0.95rem;
        color: var(--bg);
        background: var(--accent);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      button:hover {
        background: #0891b2;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px var(--accent-glow);
      }

      button:focus {
        outline: none;
        box-shadow: 0 0 0 3px var(--accent-soft);
      }

      .quick-links {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .quick-link {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px 16px;
        border-radius: var(--radius-sm);
        background: transparent;
        border: 1px solid var(--border);
        color: var(--text-secondary);
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
        transition: all 0.2s ease;
      }

      .quick-link:hover {
        background: var(--surface-elevated);
        border-color: var(--border-strong);
        color: var(--text);
      }

      /* Workspace Sections */
      .workspace {
        margin-top: 24px;
        padding: 32px;
        border-radius: var(--radius-lg);
        background: var(--surface);
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
        backdrop-filter: blur(20px);
        animation: fadeUp 0.5s ease-out backwards;
      }

      .workspace:nth-of-type(2) { animation-delay: 0.1s; }
      .workspace:nth-of-type(3) { animation-delay: 0.2s; }
      .workspace:nth-of-type(4) { animation-delay: 0.3s; }

      .workspace.status-banner {
        border-color: rgba(239, 68, 68, 0.3);
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), var(--surface));
      }

      .workspace.empty-workspace {
        min-height: 480px;
      }

      .workspace-head {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 24px;
        margin-bottom: 28px;
      }

      .workspace-head h2 {
        font-size: clamp(1.5rem, 2.5vw, 2rem);
        line-height: 1.2;
        margin-top: 8px;
      }

      .workspace-copy {
        margin-top: 8px;
        max-width: 56ch;
        color: var(--text-secondary);
        font-size: 1rem;
        line-height: 1.7;
      }

      .workspace-copy strong {
        color: var(--text);
        font-weight: 600;
      }

      .workspace-copy code {
        color: var(--accent);
      }

      .workspace-meta {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px;
      }

      .workspace-pill {
        display: inline-flex;
        align-items: center;
        height: 32px;
        padding: 0 14px;
        border-radius: 999px;
        background: var(--surface-elevated);
        border: 1px solid var(--border);
        color: var(--text-secondary);
        font-size: 0.8rem;
        font-weight: 500;
      }

      .workspace-pill-accent {
        background: var(--accent-soft);
        border-color: rgba(6, 182, 212, 0.3);
        color: var(--accent);
      }

      .workspace-pill-version {
        background: var(--bg-elevated);
        color: var(--text);
      }

      /* Metric Grid - Asymmetric */
      .metric-grid {
        display: grid;
        grid-template-columns: 1.3fr 1fr 1fr 0.8fr;
        gap: 16px;
      }

      .metric-tile {
        padding: 24px;
        border-radius: var(--radius);
        background: var(--surface-elevated);
        border: 1px solid var(--border);
        transition: all 0.3s ease;
        animation: fadeUp 0.4s ease-out backwards;
        animation-delay: var(--delay, 0s);
      }

      .metric-tile:hover {
        border-color: var(--border-strong);
        transform: translateY(-4px);
        box-shadow: var(--shadow);
      }

      .metric-tile--highlight {
        background: linear-gradient(135deg, var(--accent-soft) 0%, var(--surface-elevated) 100%);
        border-color: rgba(6, 182, 212, 0.2);
      }

      .metric-tile strong {
        display: block;
        margin-top: 8px;
        font-size: clamp(1.75rem, 2.5vw, 2.25rem);
      }

      .metric-tile span {
        display: block;
        margin-top: 8px;
        color: var(--text-tertiary);
        font-size: 0.8rem;
      }

      /* Empty State Grid - Asymmetric */
      .empty-grid {
        display: grid;
        grid-template-columns: 1fr 1.1fr 1fr;
        gap: 16px;
      }

      .empty-card {
        padding: 28px;
        border-radius: var(--radius);
        background: var(--surface-elevated);
        border: 1px solid var(--border);
        transform: translateY(var(--offset, 0));
        transition: all 0.3s ease;
      }

      .empty-card:hover {
        border-color: var(--border-strong);
        box-shadow: var(--shadow);
      }

      .empty-card:nth-child(1):hover { transform: translateY(calc(var(--offset, 0px) - 4px)); }
      .empty-card:nth-child(2):hover { transform: translateY(calc(var(--offset, 0px) - 4px)); }
      .empty-card:nth-child(3):hover { transform: translateY(calc(var(--offset, 0px) - 4px)); }

      .empty-card h3 {
        margin-top: 14px;
        font-size: 1.05rem;
      }

      .empty-card p {
        margin-top: 8px;
        color: var(--text-tertiary);
        font-size: 0.9rem;
        line-height: 1.6;
      }

      .console-card {
        grid-column: 1 / -1;
        display: grid;
        gap: 10px;
        margin-top: 16px;
        padding: 24px;
        border-radius: var(--radius);
        background: var(--code-bg);
        border: 1px solid var(--border);
      }

      .console-card code {
        display: block;
        padding: 12px 14px;
        border-radius: var(--radius-sm);
        background: rgba(0, 0, 0, 0.3);
        color: var(--accent);
        font-size: 0.85rem;
        border: 1px solid var(--border);
      }

      /* Asset Grid - Asymmetric */
      .asset-grid {
        display: grid;
        grid-template-columns: 1.35fr 1fr;
        gap: 24px;
      }

      .feature-card {
        padding: 24px;
        border-radius: var(--radius);
        background: var(--surface-elevated);
        border: 1px solid var(--border);
      }

      .section-stack {
        display: grid;
        gap: 6px;
        margin-bottom: 20px;
      }

      .section-stack h3 {
        font-size: clamp(1.25rem, 2vw, 1.5rem);
      }

      .card-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      .asset-tile {
        display: grid;
        gap: 16px;
        padding: 20px;
        border-radius: var(--radius);
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        transition: all 0.3s ease;
      }

      .asset-tile:hover {
        border-color: var(--border-strong);
      }

      .asset-head {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 12px;
        flex-wrap: wrap;
      }

      .asset-note {
        margin-top: 4px;
        color: var(--text-tertiary);
        font-size: 0.85rem;
        line-height: 1.5;
      }

      .card-frame {
        display: block;
        padding: 12px;
        border-radius: var(--radius-sm);
        background: var(--code-bg);
        border: 1px solid var(--border);
        transition: all 0.3s ease;
      }

      .card-frame:hover {
        border-color: var(--accent);
        box-shadow: 0 0 20px var(--accent-soft);
      }

      .card-preview {
        display: block;
        width: 100%;
        height: auto;
        border-radius: 8px;
      }

      .asset-foot {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* Theme List */
      .theme-list {
        display: grid;
        gap: 16px;
      }

      .theme-row {
        display: grid;
        gap: 16px;
        padding: 20px;
        border-radius: var(--radius);
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        transition: all 0.3s ease;
      }

      .theme-row:hover {
        border-color: var(--border-strong);
      }

      .theme-row-head {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 12px;
        flex-wrap: wrap;
      }

      .theme-row h3 {
        font-size: 1.05rem;
      }

      .theme-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .badge-lane {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        padding: 16px;
        border-radius: var(--radius-sm);
        background: var(--code-bg);
        border: 1px solid var(--border);
      }

      .badge-lane img {
        display: block;
        height: 28px;
        width: auto;
      }

      /* Snippet Grid - Asymmetric */
      .snippet-grid {
        display: grid;
        grid-template-columns: 1.15fr 1fr 0.85fr;
        gap: 16px;
      }

      .snippet-card {
        padding: 20px;
        border-radius: var(--radius);
        background: var(--surface-elevated);
        border: 1px solid var(--border);
        transition: all 0.3s ease;
      }

      .snippet-card:nth-child(1) { transform: translateY(0); }
      .snippet-card:nth-child(2) { transform: translateY(24px); }
      .snippet-card:nth-child(3) { transform: translateY(48px); }

      .snippet-card:hover {
        border-color: var(--border-strong);
      }

      .snippet-card:nth-child(1):hover { transform: translateY(-4px); }
      .snippet-card:nth-child(2):hover { transform: translateY(20px); }
      .snippet-card:nth-child(3):hover { transform: translateY(44px); }

      .snippet-card-head {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 12px;
        margin-bottom: 16px;
      }

      .snippet-card h3 {
        font-size: 1.05rem;
      }

      .snippet-note {
        margin-top: 4px;
        color: var(--text-tertiary);
        font-size: 0.85rem;
        line-height: 1.5;
      }

      .snippet-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      /* Buttons and Links */
      .copy-button {
        min-width: 100px;
        padding: 10px 16px;
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-sm);
        background: var(--bg-elevated);
        color: var(--text);
        font: inherit;
        font-weight: 600;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .copy-button:hover {
        background: var(--accent-soft);
        border-color: var(--accent);
        color: var(--accent);
      }

      .copy-button:focus {
        outline: none;
        box-shadow: 0 0 0 3px var(--accent-soft);
      }

      .copy-button.is-copied {
        background: var(--accent);
        border-color: var(--accent);
        color: var(--bg);
      }

      .text-link {
        color: var(--accent);
        font-weight: 500;
        font-size: 0.9rem;
        text-decoration: none;
        transition: opacity 0.2s;
      }

      .text-link:hover {
        opacity: 0.8;
      }

      .workspace-link,
      .snippet-link {
        display: inline-flex;
        align-items: center;
        height: 40px;
        padding: 0 16px;
        border-radius: var(--radius-sm);
        background: transparent;
        border: 1px solid var(--border-strong);
        color: var(--text);
        font-weight: 500;
        font-size: 0.9rem;
        text-decoration: none;
        transition: all 0.2s ease;
      }

      .workspace-link:hover,
      .snippet-link:hover {
        background: var(--accent-soft);
        border-color: var(--accent);
        color: var(--accent);
      }

      /* Code Blocks */
      pre {
        margin: 0;
        padding: 16px 18px;
        min-height: 100px;
        max-height: 200px;
        overflow: auto;
        border-radius: var(--radius-sm);
        background: var(--code-bg);
        color: var(--text-secondary);
        border: 1px solid var(--border);
        font-size: 0.8rem;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .copy-surface {
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .copy-surface:hover {
        border-color: var(--accent);
        background: rgba(6, 182, 212, 0.05);
      }

      .copy-surface:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-soft);
      }

      /* Toast */
      .copy-toast {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 100;
        min-width: 200px;
        padding: 16px 20px;
        border-radius: var(--radius-sm);
        background: var(--bg-elevated);
        border: 1px solid var(--border-strong);
        color: var(--text);
        font-weight: 500;
        box-shadow: var(--shadow-lg);
        backdrop-filter: blur(20px);
        opacity: 0;
        transform: translateY(12px);
        pointer-events: none;
        transition: all 0.3s ease;
      }

      .copy-toast.is-visible {
        opacity: 1;
        transform: translateY(0);
      }

      .copy-toast.is-error {
        border-color: rgba(239, 68, 68, 0.3);
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), var(--bg-elevated));
      }

      /* Responsive */
      @media (max-width: 1200px) {
        .hero {
          grid-template-columns: 1fr;
          gap: 32px;
        }

        .hero__sidebar {
          max-width: 420px;
        }

        .asset-grid {
          grid-template-columns: 1fr;
        }

        .snippet-grid {
          grid-template-columns: 1fr 1fr;
        }

        .snippet-card:nth-child(3) {
          grid-column: 1 / -1;
          transform: translateY(0);
        }

        .snippet-card:nth-child(3):hover {
          transform: translateY(-4px);
        }
      }

      @media (max-width: 900px) {
        main {
          padding: 24px 16px 60px;
        }

        .hero {
          padding: 32px 24px;
        }

        .hero__steps {
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .step-card,
        .step-card:nth-child(2),
        .step-card:nth-child(3) {
          transform: translateY(0);
        }

        .step-card:hover,
        .step-card:nth-child(2):hover,
        .step-card:nth-child(3):hover {
          transform: translateY(-4px);
        }

        .metric-grid {
          grid-template-columns: 1fr 1fr;
        }

        .empty-grid {
          grid-template-columns: 1fr;
        }

        .empty-card {
          --offset: 0px !important;
        }

        .card-grid {
          grid-template-columns: 1fr;
        }

        .snippet-grid {
          grid-template-columns: 1fr;
        }

        .snippet-card,
        .snippet-card:nth-child(2),
        .snippet-card:nth-child(3) {
          transform: translateY(0);
        }

        .snippet-card:hover,
        .snippet-card:nth-child(2):hover,
        .snippet-card:nth-child(3):hover {
          transform: translateY(-4px);
        }

        .workspace-head {
          flex-direction: column;
        }

        .workspace-meta {
          justify-content: flex-start;
        }
      }

      @media (max-width: 600px) {
        .hero__title {
          font-size: 2rem;
        }

        .workspace {
          padding: 20px;
        }

        .metric-grid {
          grid-template-columns: 1fr;
        }

        .badge-lane img {
          height: 24px;
        }

        .asset-head,
        .theme-row-head,
        .snippet-card-head {
          flex-direction: column;
          align-items: stretch;
        }

        .copy-button {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <div class="bg-wrapper">
      <div class="bg-grid"></div>
      <div class="bg-glow bg-glow--primary"></div>
      <div class="bg-glow bg-glow--secondary"></div>
      <div class="bg-glow bg-glow--tertiary"></div>
    </div>
    <main>
      <section class="hero">
        <div class="hero__content">
          <div class="hero__brand">
            ${renderBrandMark()}
            <div>
              <p class="section-label">ClawBadge Generator</p>
              <h1 class="hero__title">Generate README embeds for ClawHub skills.</h1>
              <p class="hero__description">Enter a public slug, review the live SVG previews, then copy the markdown you actually want to ship.</p>
            </div>
          </div>
          <div class="hero__steps">
            <article class="step-card">
              <span class="step-index">1</span>
              <div>
                <strong>Load a public skill</strong>
                <p>Paste any ClawHub slug to fetch live data.</p>
              </div>
            </article>
            <article class="step-card">
              <span class="step-index">2</span>
              <div>
                <strong>Inspect the SVG previews</strong>
                <p>Check the card themes and badge rows before copying.</p>
              </div>
            </article>
            <article class="step-card">
              <span class="step-index">3</span>
              <div>
                <strong>Copy markdown</strong>
                <p>Use the buttons or click the code blocks directly.</p>
              </div>
            </article>
          </div>
        </div>
        <div class="hero__sidebar">
          <div class="host-badge">
            <p class="section-label">API Host</p>
            <code>${escapeXml(origin)}</code>
          </div>
          <div class="hero__form">
            <form id="slug-form">
              <input id="slug-input" name="slug" value="${escapeXml(defaultSlug)}" placeholder="Enter skill slug..." autocomplete="off" spellcheck="false" />
              <button type="submit">Load skill</button>
            </form>
            <div class="quick-links">
              <a class="quick-link" href="/generate/free-ride">Try demo skill</a>
              <a class="quick-link" href="/api/health">Check API health</a>
              <a class="quick-link" href="/badge/free-ride/downloads.svg">Open a sample badge</a>
            </div>
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
