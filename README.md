# Coinversa Pulse docs

Documentation site for [Coinversa Pulse](https://coinversa.ai) — the Hyperliquid crypto-intelligence REST API and MCP server. Live at [docs.coinversa.ai](https://docs.coinversa.ai), built on [Mintlify](https://mintlify.com).

## Layout

- Pages are MDX files with YAML frontmatter (`title` + `description` only — descriptions feed the auto-generated `/llms.txt`, so write them as standalone one-liners).
- Navigation lives in `docs.json`.
- `api-reference/openapi.json` is **auto-synced daily** (06:00 UTC) from `https://api.coinversa.ai/openapi.json` by `.github/workflows/sync-openapi.yml` — **never hand-edit it**. The workflow rewrites `servers` and strips an invalid `scheme` huma emits; if you must sync out of band, run the workflow via `workflow_dispatch` or replicate that exact massage.
- Endpoint reference pages are generated from the spec at slugs derived from operation ids (e.g. `/api-reference/get-api-public-v1-builders-leaderboard`). Everything else is hand-maintained.

## Hand-maintained pages that track the API

When new endpoints land in the spec, these pages need matching updates (the sync workflow can't do it):

- `api-reference/tiers.mdx` — endpoint-by-tier matrix (verify gates against the API's Go route registrations)
- `api-reference/data-windows.mdx` — window semantics
- `changelog/overview.mdx` — release entry
- `mcp/tools.mdx` — only if MCP tools shipped too

## Development

```bash
npx mint dev            # local preview at http://localhost:3000
npx mint broken-links   # link check (MDX pages only — it skips plain .md files)
```

## Publishing

Pushes to `main` deploy automatically via the Mintlify GitHub app.
