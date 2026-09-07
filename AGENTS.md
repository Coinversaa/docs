# Documentation project instructions

## About this project

- Documentation site for **Coinversa Pulse** (Hyperliquid crypto-intelligence REST API, MCP server, and WebSocket fill stream), built on [Mintlify](https://mintlify.com), deployed to docs.coinversa.ai on push to `main`.
- Pages are MDX with YAML frontmatter; navigation lives in `docs.json`.
- Preview with `npx mint dev`; check links with `npx mint broken-links` (it does not check plain `.md` files like this one).

## The OpenAPI spec is bot-synced — never hand-edit it

`api-reference/openapi.json` is committed daily at 06:00 UTC by `.github/workflows/sync-openapi.yml` from `https://api.coinversa.ai/openapi.json`. Any hand edit will be overwritten. To sync out of band, trigger the workflow (`workflow_dispatch`) or replicate its exact massage: rewrite `servers` to `[{"url": "https://api.coinversa.ai", "description": "Production"}]`, strip the invalid `scheme` key from `components.securitySchemes.apiKey`, and write with `indent=2, ensure_ascii=False`.

Endpoint pages are auto-generated from the spec at slugs equal to the operation ids (e.g. `/api-reference/get-api-public-v1-builders-leaderboard`). The spec has no tags or descriptions, so the semantic load is carried by the hand-written prose pages — link the generated pages from them.

## Pages that must track API releases

When a sync lands new endpoints, update these hand-maintained pages (the workflow's own comment lists them too). The WebSocket section (`websocket/*.mdx`) is outside the spec entirely and tracks `Coinversaa/websocket` instead — see the WebSocket rules below.

1. `api-reference/tiers.mdx` — endpoint-by-tier matrix. Verify gates against the API repo's Go route registrations (`Tier(TIER_...)` on each route), not from memory.
2. `api-reference/data-windows.mdx` — window/clamp semantics (enforced in SQL, invisible in the spec).
3. `changelog/overview.mdx` — an `<Update label="Month D, YYYY" tags={["API"]}>` block with an H2 inside.
4. `mcp/tools.mdx` — only if MCP tools shipped alongside (the MCP surface can lag REST; builder analytics is REST/x402-only today).

## Two protocols, two rulebooks

The REST API and the WebSocket are different protocols with different auth, different failures, different limits and a different consumption model. Every rule below is scoped to one of them. A shared page states its own protocol's rules and carries a short pointer to the other — it never says "except for websockets" in the middle of a REST sentence. The contradictions that prompted this section (a global "never a Bearer token", a global "there is no 401") came from rules written as universal truths.

## Fact-checking rules — REST (`api.coinversa.ai/api/public/v1`)

- **Never document endpoints, params, or response fields that are not live in production.** In-review features get at most one hedged "coming" line in the changelog — no route docs, no promised dates.
- Error responses are huma **problem details** (`title` / `status` / `detail` / `code`, plus `current_tier` / `required_tier` / `upgrade_url` on `TIER_GATE`) — not `success: false`. REST auth failures are 403; the REST API never returns 401.
- REST auth is the `X-API-Key` header. An `Authorization: Bearer` header is ignored by the REST API and treated as a missing key. (The WebSocket is the opposite — see below.)
- Rate limits (per-minute / daily / monthly) come from the API repo's `tiers.go` `TIER_CONFIGS` — but its 4th field is the rate-limiter **burst** amount (token-bucket burst consumed in `auth.go`), NOT a key count. Max active keys are enforced by the TS backend: `backend/src/billing/tiers.ts` `TIER_LIMITS.maxKeys` — Free 1 / Starter 3 / Pro 10 / Enterprise unlimited (`maxKeys: 0`).
- State data caveats plainly and early (silent 90d `since` clamps, attribution coverage, backfill status). Builder responses carry a `dataNotes` disclosure — docs must reflect it, not soften it.

## Fact-checking rules — WebSocket (`wss://ws.coinversa.ai`)

The source of truth is `docs/protocol.md` in `Coinversaa/websocket` on its `production` branch, and the live reference at developers.coinversa.ai/websockets. Verify against production before writing; the strings and codes below are exact.

- **Auth is a Bearer token, in one of two places.** Servers send `Authorization: Bearer <key>` on the HTTP upgrade. Browsers, whose `WebSocket` constructor cannot set headers, offer the key as the second `Sec-WebSocket-Protocol` entry after the literal `bearer` (`new WebSocket(url, ['bearer', key])`); the server selects and echoes `bearer`. Whichever input is present decides — a bad header is never rescued by a subprotocol. A key is **never** accepted in the URL; document it nowhere else.
- **A refused upgrade is not a frame, and it is not 403.** Header clients get HTTP `401` (invalid or missing key), `429` (the account's connection cap is full), `503` (entitlement lookup unavailable) on the upgrade, before any socket exists. Browser (subprotocol) clients cannot read that status, so the handshake completes and the socket is closed at once with close code `4401` / `4429` / `4503` and the same reason text. Those close codes are a public wire contract; say so.
- **In-band errors are exact strings** on an open socket: `too many subscriptions`, `unknown subscription type`, `missing argument <arg>`, `unknown method`, `feed not in tier`, `bad request`, `server at subscription capacity`. Quote them verbatim.
- **Limits are capacity, not requests.** The connection cap is **per account, shared across every key**; the subscription cap is **per connection**; bandwidth is a **fair-use** allowance. None of this draws down REST rate limits, and REST quotas say nothing about it. The `connected` frame reports the account's **resolved** limits, enterprise overrides included — never present the tier table as what an enterprise account gets.
- **`seq` is per subscription and restarts per connection.** Data frames carry `channel`, `seq` and `data` and **no subscription id**, so a client with several subscriptions on one channel cannot attribute a frame from the frame alone — say so plainly.
- **Fill fields come from the census, not from memory.** Always present: `coin`, `px`, `sz`, `side`, `time`, `dir`, `closedPnl`, `startPosition`, `fee`, `feeToken`, `hash`, `oid`, `tid`, `crossed`, `twapId`. Sometimes: `cloid`, `builder`, `builderFee`, `deployerFee`, `priorityGas`. `closedPnl` and `startPosition` come from the Hyperliquid node; we do not compute them, and nothing may imply we do.
- **No latency figures, anywhere.** They drift, and a wrong one is what the landing-page audit caught. Throughput is a property of the market, not of the infrastructure; if a rate appears, label it as market throughput.
- **Client code samples are generated, never hand-written.** The developer portal generates the Browser, Node, Python and Go clients from one module (`src/lib/websocketClientCode.js` in `Coinversaa/coinversa-developers`); `websocket/quickstart.mdx` embeds that output between `{/* generated:start */}` / `{/* generated:end */}` markers (JSX comments — MDX rejects HTML comments), written by `scripts/sync-websocket-samples.mjs`. Re-run the script, never edit inside the markers. A third hand-maintained copy is how the portal came to document a protocol the server had stopped speaking.

## Terminology

- **Builder code** — an address that attaches a fee to orders it routes (front-ends, wallet apps, bots). The `/builders/*` endpoints are about builder codes.
- **Builder dex** — a venue built on Hyperliquid with its own listings (`xyz`, `flx`, `vntl`, `hyna`, `km`, `abcd`, `cash`). Every builder dex runs a builder code, but most builder codes are not dexes. Never use bare "builder" where the two could be confused; `concepts/markets.mdx` covers dexes, `concepts/builder-attribution.mdx` covers codes.
- **Cohort tiers** — two systems: PnL tiers (Apex/`apex` … Blown Out/`blown_out`) and size tiers (Heavyweights/`heavyweights` … Strawweights/`strawweights`). Responses currently return the **legacy slugs** (`money_printer`…`giga_rekt`, `leviathan`…`shrimp`); new slugs are input-canonical. Builder endpoints use **lifetime** tiers; pulse `cohorts-recent` endpoints use 30d-rolling tiers.
- **Ledger plane vs attribution plane** — builder revenue is exact (Hyperliquid's cumulative builder-fee ledger); fills/volume/user metrics are join-attributed and slightly undercount. Say "ledger-exact" for revenue, "attributed" for the rest.
- **x402** — keyless pay-per-call twins at `/x402/api/public/v1/<same path>`. The twin exists for **every GET endpoint** (registered by the shared route wrapper; live since May 2026) — builder endpoints are merely the first *documented* x402 surface. Deliberately absent from the OpenAPI spec; documented in `api-reference/tiers.mdx`.

## Style preferences

- Direct second person, em-dash-heavy, **bold key terms** on first use.
- Short declarative lead paragraph before the first H2; sentence-case headings ("## PnL tiers").
- Tables for enumerations; "which endpoint/tool when" two-column tables are a house pattern.
- Components in use: `<Note>`, `<Warning>`, `<Columns>`/`<Card>`, `<Steps>`, `<CodeGroup>` (`bash curl` + `python Python` labels), `<AccordionGroup>`/`<Accordion>`, `<Update>` for changelog.
- Endpoint paths as inline code without base URL (`/builders/leaderboard`); cross-links root-relative (`/concepts/cohorts`). WebSocket frames are shown as JSON code blocks, one frame per line, with `→` for client-to-server and `←` for server-to-client in exchanges.
- Frontmatter is quoted `title` + `description` only (no icons/og fields). Descriptions double as the auto-generated `/llms.txt` entries — write standalone, keyword-dense one-liners.
- Changelog entries are marketing-tinged but strictly factual, with bold feature names and competitive context in parentheses.

## Content boundaries

- Don't document internal/admin surfaces, the service-key on-behalf-of auth path, or database internals.
- Don't invent pricing for x402 calls — the per-call price is quoted in the 402 challenge.
- Competitive claims must stay factual and verifiable (e.g. "attributed history since 2025-01-25" — phrased as history depth, not as arbitrary-range query access, since per-request windows clamp at 90d).
