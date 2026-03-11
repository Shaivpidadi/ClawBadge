# ClawBadge

ClawBadge is a read-only badge service that turns public ClawHub skill stats into embeddable GitHub README badges and summary cards.

## Features

- Validates skill slugs before any outbound request.
- Fetches public ClawHub skill data with timeout, payload-size limits, and schema validation.
- Normalizes upstream data into a stable JSON shape.
- Caches normalized skill data with fresh and stale windows.
- Renders themed SVG metric badges and a richer summary card.
- Provides a generator page with copy-paste markdown snippets.
- Applies per-IP rate limiting for badge, JSON, and generator routes.
- Returns graceful SVG fallback states for invalid, missing, rate-limited, and unavailable badge requests.

## Stack

- TypeScript
- Hono
- `zod`
- `lru-cache`
- Vitest

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

The local server starts on `http://localhost:3000` by default.

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Local Node server port. |
| `CLAWHUB_API_BASE` | `https://clawhub.ai/api/v1` | Fixed upstream base URL. |
| `CACHE_TTL_SECONDS` | `300` | Fresh cache lifetime. |
| `STALE_TTL_SECONDS` | `3600` | Serve-stale window after freshness expires. |
| `UPSTREAM_TIMEOUT_MS` | `2500` | ClawHub request timeout. |
| `MAX_UPSTREAM_BYTES` | `128000` | Maximum accepted upstream payload size. |
| `MEMORY_CACHE_SIZE` | `1000` | Max in-memory cache entries. |
| `RATE_LIMIT_ENABLED` | `1` | Enables per-IP throttling. |
| `LOG_LEVEL` | `info` | Structured log threshold. |

## Routes

### Health

- `GET /api/health`

### Normalized JSON

- `GET /api/skills/:slug`

Example response:

```json
{
  "slug": "free-ride",
  "displayName": "Free Ride - Unlimited free AI",
  "summary": "...",
  "version": "1.0.4",
  "downloads": 32517,
  "installsCurrent": 180,
  "installsAllTime": 183,
  "stars": 248,
  "comments": 23,
  "versions": 4,
  "owner": {
    "handle": "Shaivpidadi",
    "displayName": "Shaishav Pidadi"
  },
  "createdAt": 1770313337350,
  "updatedAt": 1772065840450,
  "source": "clawhub"
}
```

### SVG badges

- `GET /badge/:slug/downloads.svg`
- `GET /badge/:slug/installs-current.svg`
- `GET /badge/:slug/installs-all-time.svg`
- `GET /badge/:slug/stars.svg`
- `GET /badge/:slug/version.svg`
- `GET /badge/:slug/card.svg`

Supported query params:

- `theme=default|dark|flat`
- `label=...` for single-stat badges
- `compact=1` for the card
- `showOwner=1` for the card
- `showUpdated=1` for the card

### Generator UI

- `GET /`
- `GET /generate/:slug`

## Example Markdown

Replace `YOUR_DOMAIN` with the deployed domain:

```md
[![ClawHub Downloads](https://YOUR_DOMAIN/badge/free-ride/downloads.svg)](https://clawhub.ai/skills/free-ride)
[![ClawHub Current Installs](https://YOUR_DOMAIN/badge/free-ride/installs-current.svg)](https://clawhub.ai/skills/free-ride)
[![ClawHub Stars](https://YOUR_DOMAIN/badge/free-ride/stars.svg)](https://clawhub.ai/skills/free-ride)
[![ClawHub Version](https://YOUR_DOMAIN/badge/free-ride/version.svg)](https://clawhub.ai/skills/free-ride)
[![ClawHub Card](https://YOUR_DOMAIN/badge/free-ride/card.svg)](https://clawhub.ai/skills/free-ride)
```

## Development Commands

```bash
npm run dev
npm run typecheck
npm run build
npm test
npm run test:update
```

## Testing

The suite covers:

- slug validation
- upstream normalization/version fallback
- stale-cache behavior
- rate limiting
- route responses
- SVG snapshot output

## Deployment

### Node container or VM

```bash
npm install
npm run build
npm start
```

### Vercel

The repo includes:

- [`api/index.ts`](api/index.ts) using Hono’s Vercel adapter
- [`vercel.json`](vercel.json) rewriting all routes to the function entrypoint

Deploy the repository directly on Vercel and set the same environment variables listed above.

### Cloudflare Workers

The repo includes [`wrangler.toml`](wrangler.toml) with `src/app.ts` as the worker entrypoint. Set production values with Wrangler or the Cloudflare dashboard before publishing.

## Security Notes

- ClawBadge never accepts arbitrary upstream URLs.
- Skill slugs are strictly validated with `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- Upstream responses are size-limited, timed out, and schema-validated.
- SVG text is escaped before rendering.
- Public routes use cache headers and per-IP rate limiting.
