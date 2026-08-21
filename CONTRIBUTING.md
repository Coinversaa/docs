# Contribute to the Coinversa Pulse docs

Thanks for helping improve the docs. A few repo-specific rules keep them trustworthy.

## Ground rules

- **Never hand-edit `api-reference/openapi.json`** — it's overwritten daily by the sync workflow (see the README).
- **Never document endpoints, parameters, or fields that aren't live in production.** If a feature is in review, it gets at most one hedged "coming" line in the changelog — no route docs, no dates.
- **State data caveats plainly and early.** These docs never hide limitations (silent clamps, attribution coverage, backfill status) — that honesty is a product feature.
- Verify tier gates and response shapes against the live API before writing them down; the error shapes are huma problem details (`title` / `status` / `detail` / `code`), not `success: false`.

## How to contribute

1. Fork and clone this repository, then create a branch.
2. Make your changes (pages are MDX + YAML frontmatter; nav is `docs.json`).
3. Preview with `npx mint dev` at `http://localhost:3000`.
4. Run `npx mint broken-links` before opening a pull request.

## Writing guidelines

- **Use active voice and second person**: "Pass your key in the `X-API-Key` header."
- **Keep sentences concise**: one idea per sentence; sentence-case headings.
- **Use consistent terminology**: see the terminology section in `AGENTS.md` — in particular, "builder code" vs "builder dex" are different concepts.
- **Include examples**: real request/response JSON beats prose.
- **Frontmatter descriptions double as `/llms.txt` entries** — write them as standalone, keyword-dense one-liners.
