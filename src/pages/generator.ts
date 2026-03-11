import type { NormalizedSkill } from "../types.js";
import { escapeXml } from "../lib/svg.js";

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

function buildMarkdown(origin: string, slug: string, theme: "default" | "dark"): MarkdownSnippets {
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

function renderSnippetBlock(title: string, snippet: string): string {
  return `<section class="snippet">
    <div class="snippet-header">
      <h3>${escapeXml(title)}</h3>
    </div>
    <pre>${escapeXml(snippet)}</pre>
  </section>`;
}

export function renderGeneratorPage({ slug, origin, skill, error }: GeneratorPageOptions): string {
  const defaultSlug = slug ?? "";
  const defaultMarkdown = defaultSlug ? buildMarkdown(origin, defaultSlug, "default") : null;
  const darkMarkdown = defaultSlug ? buildMarkdown(origin, defaultSlug, "dark") : null;

  const previewSection =
    skill && defaultMarkdown && darkMarkdown
      ? `<section class="panel">
          <div class="panel-head">
            <div>
              <p class="eyebrow">Live Preview</p>
              <h2>${escapeXml(skill.displayName)}</h2>
              <p>${escapeXml(skill.summary || "Live badge and card previews built from the normalized ClawHub response.")}</p>
            </div>
            <span class="pill">${escapeXml(skill.slug)}</span>
          </div>
          <div class="preview-grid">
            <div class="preview-card">
              <h3>Default badges</h3>
              <img src="${escapeXml(`${origin}/badge/${skill.slug}/downloads.svg`)}" alt="Downloads badge" />
              <img src="${escapeXml(`${origin}/badge/${skill.slug}/installs-current.svg`)}" alt="Current installs badge" />
              <img src="${escapeXml(`${origin}/badge/${skill.slug}/stars.svg`)}" alt="Stars badge" />
              <img src="${escapeXml(`${origin}/badge/${skill.slug}/version.svg`)}" alt="Version badge" />
            </div>
            <div class="preview-card">
              <h3>Summary card</h3>
              <img class="card-preview" src="${escapeXml(`${origin}/badge/${skill.slug}/card.svg?showOwner=1&showUpdated=1`)}" alt="ClawHub summary card" />
            </div>
            <div class="preview-card">
              <h3>Dark summary card</h3>
              <img class="card-preview" src="${escapeXml(`${origin}/badge/${skill.slug}/card.svg?theme=dark&showOwner=1&showUpdated=1`)}" alt="ClawHub summary card dark" />
            </div>
          </div>
        </section>
        <section class="panel snippets">
          <div class="panel-head">
            <div>
              <p class="eyebrow">Markdown</p>
              <h2>Copy-paste snippets</h2>
              <p>These use absolute badge URLs so they work directly in GitHub README files.</p>
            </div>
          </div>
          <div class="snippet-grid">
            ${renderSnippetBlock("Single badge", defaultMarkdown.downloads)}
            ${renderSnippetBlock("Default badge row", defaultMarkdown.multi)}
            ${renderSnippetBlock("Summary card", defaultMarkdown.card)}
            ${renderSnippetBlock("Dark summary card", darkMarkdown.card)}
          </div>
        </section>`
      : "";

  const errorSection = error
    ? `<section class="panel error-panel">
        <p class="eyebrow">Status</p>
        <h2>${escapeXml(error.title)}</h2>
        <p>${escapeXml(error.message)}</p>
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
        color-scheme: light;
        --bg: #0f172a;
        --bg-accent: #164e63;
        --panel: rgba(255, 255, 255, 0.92);
        --panel-alt: rgba(255, 255, 255, 0.78);
        --text: #0f172a;
        --muted: #475569;
        --line: rgba(15, 23, 42, 0.08);
        --brand: #0f766e;
        --brand-alt: #f59e0b;
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(245, 158, 11, 0.24), transparent 28%),
          radial-gradient(circle at bottom right, rgba(45, 212, 191, 0.16), transparent 30%),
          linear-gradient(135deg, var(--bg) 0%, var(--bg-accent) 100%);
        color: #e2e8f0;
      }

      main {
        width: min(1120px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 32px 0 56px;
      }

      .hero,
      .panel {
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: var(--panel);
        color: var(--text);
        backdrop-filter: blur(18px);
        border-radius: 28px;
        box-shadow: 0 22px 40px rgba(15, 23, 42, 0.24);
      }

      .hero {
        padding: 32px;
        display: grid;
        gap: 20px;
      }

      .hero h1,
      .panel h2,
      .preview-card h3,
      .snippet h3 {
        margin: 0;
        font-family: "Space Grotesk", "Segoe UI", sans-serif;
        letter-spacing: -0.03em;
      }

      .hero h1 { font-size: clamp(2.2rem, 5vw, 4rem); }
      .hero p,
      .panel p,
      .preview-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }

      .eyebrow {
        margin: 0 0 8px;
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--brand);
      }

      form {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      input {
        flex: 1 1 260px;
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 16px 18px;
        font: inherit;
        background: rgba(255, 255, 255, 0.8);
      }

      button,
      .pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
      }

      button {
        border: 0;
        padding: 16px 20px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        color: #f8fafc;
        background: linear-gradient(135deg, var(--brand), var(--brand-alt));
      }

      .pill {
        background: rgba(15, 118, 110, 0.12);
        color: var(--brand);
        padding: 8px 12px;
        font-size: 0.88rem;
        font-weight: 700;
      }

      .panel {
        margin-top: 20px;
        padding: 24px;
      }

      .panel-head {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 16px;
        margin-bottom: 18px;
      }

      .preview-grid,
      .snippet-grid {
        display: grid;
        gap: 16px;
      }

      .preview-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .snippet-grid {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }

      .preview-card,
      .snippet {
        border-radius: 22px;
        padding: 18px;
        background: var(--panel-alt);
        border: 1px solid var(--line);
      }

      .preview-card {
        display: grid;
        gap: 12px;
      }

      img {
        max-width: 100%;
        height: auto;
      }

      .card-preview {
        width: 100%;
        border-radius: 18px;
      }

      pre {
        margin: 0;
        padding: 14px;
        overflow-x: auto;
        border-radius: 16px;
        background: #111827;
        color: #e5e7eb;
        font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
        font-size: 0.86rem;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .error-panel {
        border-color: rgba(239, 68, 68, 0.3);
      }

      @media (max-width: 720px) {
        main { width: min(100vw - 20px, 100%); }
        .hero,
        .panel { border-radius: 24px; padding: 20px; }
        .panel-head { flex-direction: column; }
        button { width: 100%; }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div>
          <p class="eyebrow">ClawBadge</p>
          <h1>Turn ClawHub stats into README-ready badges.</h1>
        </div>
        <p>Paste a public ClawHub skill slug to generate linked markdown, preview embeddable SVG badges, and grab a richer summary card.</p>
        <form id="slug-form">
          <input id="slug-input" name="slug" value="${escapeXml(defaultSlug)}" placeholder="free-ride" autocomplete="off" spellcheck="false" />
          <button type="submit">Generate snippets</button>
        </form>
      </section>
      ${errorSection}
      ${previewSection}
    </main>
    <script>
      const form = document.getElementById("slug-form");
      const input = document.getElementById("slug-input");
      form?.addEventListener("submit", (event) => {
        event.preventDefault();
        const slug = input?.value?.trim();
        if (!slug) return;
        window.location.href = "/generate/" + encodeURIComponent(slug);
      });
    </script>
  </body>
</html>`;
}
