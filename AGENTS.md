# Documentation project instructions

## About this project

- Documentation site for **Coinversa Pulse** (Hyperliquid crypto-intelligence API + MCP server), built on [Mintlify](https://mintlify.com), deployed to docs.coinversa.ai on push to `main`.
- Pages are MDX with YAML frontmatter; navigation lives in `docs.json`.
- Preview with `npx mint dev`; check links with `npx mint broken-links` (it does not check plain `.md` files like this one).

## The OpenAPI spec is bot-synced — never hand-edit it

`api-reference/openapi.json` is committed daily at 06:00 UTC by `.github/workflows/sync-openapi.yml` from `https://api.coinversa.ai/openapi.json`. Any hand edit will be overwritten. To sync out of band, trigger the workflow (`workflow_dispatch`) or replicate its exact massage: rewrite `servers` to `[{"url": "https://api.coinversa.ai", "description": "Production"}]`, strip the invalid `scheme` key from `components.securitySchemes.apiKey`, and write with `indent=2, ensure_ascii=False`.

Endpoint pages are auto-generated from the spec at slugs equal to the operation ids (e.g. `/api-reference/get-api-public-v1-builders-leaderboard`). The spec has no tags or descriptions, so the semantic load is carried by the hand-written prose pages — link the generated pages from them.

## Pages that must track API releases

When a sync lands new endpoints, update these hand-maintained pages (the workflow's own comment lists them too):

1. `api-reference/tiers.mdx` — endpoint-by-tier matrix. Verify gates against the API repo's Go route registrations (`Tier(TIER_...)` on each route), not from memory.
2. `api-reference/data-windows.mdx` — window/clamp semantics (enforced in SQL, invisible in the spec).
3. `changelog/overview.mdx` — an `<Update label="Month D, YYYY" tags={["API"]}>` block with an H2 inside.
4. `mcp/tools.mdx` — only if MCP tools shipped alongside (the MCP surface can lag REST; builder analytics is REST/x402-only today).

## Fact-checking rules

- **Never document endpoints, params, or response fields that are not live in production.** In-review features get at most one hedged "coming" line in the changelog — no route docs, no promised dates.
- Error responses are huma **problem details** (`title` / `status` / `detail` / `code`, plus `current_tier` / `required_tier` / `upgrade_url` on `TIER_GATE`) — not `success: false`. Auth failures are 403; there is no 401.
- Auth is the `X-API-Key` header, never a Bearer token.
- Tier limits and key counts come from the API repo's `tiers.go` `TIER_CONFIGS` (Free 2 keys / Starter 4 / Pro 5 / Enterprise 10) — ignore the legacy TS values left in comments there.
- State data caveats plainly and early (silent 90d `since` clamps, attribution coverage, backfill status). Builder responses carry a `dataNotes` disclosure — docs must reflect it, not soften it.

## Terminology

- **Builder code** — an address that attaches a fee to orders it routes (front-ends, wallet apps, bots). The `/builders/*` endpoints are about builder codes.
- **Builder dex** — a venue built on Hyperliquid with its own listings (`xyz`, `flx`, `vntl`, `hyna`, `km`, `abcd`, `cash`). Every builder dex runs a builder code, but most builder codes are not dexes. Never use bare "builder" where the two could be confused; `concepts/markets.mdx` covers dexes, `concepts/builder-attribution.mdx` covers codes.
- **Cohort tiers** — two systems: PnL tiers (Apex/`apex` … Blown Out/`blown_out`) and size tiers (Heavyweights/`heavyweights` … Strawweights/`strawweights`). Responses currently return the **legacy slugs** (`money_printer`…`giga_rekt`, `leviathan`…`shrimp`); new slugs are input-canonical. Builder endpoints use **lifetime** tiers; pulse `cohorts-recent` endpoints use 30d-rolling tiers.
- **Ledger plane vs attribution plane** — builder revenue is exact (Hyperliquid's cumulative builder-fee ledger); fills/volume/user metrics are join-attributed and slightly undercount. Say "ledger-exact" for revenue, "attributed" for the rest.
- **x402** — keyless pay-per-call twins at `/x402/api/public/v1/<same path>`, deliberately absent from the OpenAPI spec; documented in `api-reference/tiers.mdx`.

## Style preferences

- Direct second person, em-dash-heavy, **bold key terms** on first use.
- Short declarative lead paragraph before the first H2; sentence-case headings ("## PnL tiers").
- Tables for enumerations; "which endpoint/tool when" two-column tables are a house pattern.
- Components in use: `<Note>`, `<Warning>`, `<Columns>`/`<Card>`, `<Steps>`, `<CodeGroup>` (`bash curl` + `python Python` labels), `<AccordionGroup>`/`<Accordion>`, `<Update>` for changelog.
- Endpoint paths as inline code without base URL (`/builders/leaderboard`); cross-links root-relative (`/concepts/cohorts`).
- Frontmatter is quoted `title` + `description` only (no icons/og fields). Descriptions double as the auto-generated `/llms.txt` entries — write standalone, keyword-dense one-liners.
- Changelog entries are marketing-tinged but strictly factual, with bold feature names and competitive context in parentheses.

## Content boundaries

- Don't document internal/admin surfaces, the service-key on-behalf-of auth path, or database internals.
- Don't invent pricing for x402 calls — the per-call price is quoted in the 402 challenge.
- Competitive claims must stay factual and verifiable (e.g. "attributed history since 2025-01-25" — phrased as history depth, not as arbitrary-range query access, since per-request windows clamp at 90d).
