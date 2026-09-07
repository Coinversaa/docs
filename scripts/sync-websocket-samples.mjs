#!/usr/bin/env node
// Regenerates the client samples in websocket/quickstart.mdx from the developer
// portal's generator — the single source both the portal's live console and
// its reference page render from. Run it whenever that module changes:
//
//   node scripts/sync-websocket-samples.mjs /path/to/coinversa-developers
//
// The path is a local checkout of Coinversaa/coinversa-developers (main). The
// script rewrites everything between the generated:start / generated:end
// markers (JSX comments — MDX rejects HTML comments) and nothing else. Never edit inside the markers by hand: a third
// hand-maintained copy of the client is how a reference page once came to
// document a protocol the server had stopped speaking.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const portal = process.argv[2];
if (!portal) {
  console.error('usage: node scripts/sync-websocket-samples.mjs /path/to/coinversa-developers');
  process.exit(2);
}
const { CLIENT_TARGETS, generateClient } = await import(pathToFileURL(path.resolve(portal, 'src/lib/websocketClientCode.js')).href);

const WS_URL = 'wss://ws.coinversa.ai';
// Two coins on one connection: the case the quickstart prose explains.
const SUBSCRIPTIONS = [
  { type: 'tradesByCoin', coin: 'BTC' },
  { type: 'tradesByCoin', coin: 'ETH' },
];
const LANG = { javascript: 'javascript', python: 'python', go: 'go' };

const blocks = CLIENT_TARGETS.map((t) => {
  const code = generateClient({ target: t.slug, url: WS_URL, subscriptions: SUBSCRIPTIONS }).trimEnd();
  return `\`\`\`${LANG[t.language]} ${t.label}\n${code}\n\`\`\``;
});
const generated = `<CodeGroup>\n\n${blocks.join('\n\n')}\n\n</CodeGroup>`;

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../websocket/quickstart.mdx');
const src = readFileSync(file, 'utf8');
const start = src.indexOf('{/* generated:start');
const startEnd = src.indexOf('*/}', start) + 3;
const end = src.indexOf('{/* generated:end */}');
if (start < 0 || end < 0) {
  console.error('markers not found in websocket/quickstart.mdx');
  process.exit(1);
}
const out = `${src.slice(0, startEnd)}\n${generated}\n${src.slice(end)}`;
writeFileSync(file, out);
console.log(`wrote ${blocks.length} client samples into websocket/quickstart.mdx`);
