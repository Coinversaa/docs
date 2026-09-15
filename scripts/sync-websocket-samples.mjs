#!/usr/bin/env node
// Regenerates the client samples in websocket/quickstart.mdx from the developer
// portal's generator — the single source both the portal's live console and
// its reference page render from. Run it whenever that module changes:
//
//   node scripts/sync-websocket-samples.mjs /path/to/coinversa-developers
//
// The path is a local checkout of Coinversaa/coinversa-developers (main). The
// script rewrites everything between each generated:*start / generated:*end
// marker pair (JSX comments — MDX rejects HTML comments) and nothing else.
// Never edit inside the markers by hand: a third hand-maintained copy of the
// client is how a reference page once came to document a protocol the server
// had stopped speaking.
//
// Two sample sets, two marker pairs, one generator:
//   generated:start      … generated:end        the fills client (two coins)
//   generated:book:start … generated:book:end   the order-book client (l4Book)

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
const LANG = { javascript: 'javascript', python: 'python', go: 'go' };

const SAMPLE_SETS = [
  {
    // Two coins on one connection: the case the quickstart prose explains.
    start: '{/* generated:start',
    end: '{/* generated:end */}',
    subscriptions: [
      { type: 'tradesByCoin', coin: 'BTC' },
      { type: 'tradesByCoin', coin: 'ETH' },
    ],
  },
  {
    // The order book. ZEC, not BTC: the first message on a book subscription
    // is the whole book, and a sample should not start by parsing 30 MB.
    start: '{/* generated:book:start',
    end: '{/* generated:book:end */}',
    subscriptions: [{ type: 'l4Book', coin: 'ZEC' }],
  },
];

function render(subscriptions) {
  const blocks = CLIENT_TARGETS.map((t) => {
    const code = generateClient({ target: t.slug, url: WS_URL, subscriptions }).trimEnd();
    return `\`\`\`${LANG[t.language]} ${t.label}\n${code}\n\`\`\``;
  });
  return { count: blocks.length, text: `<CodeGroup>\n\n${blocks.join('\n\n')}\n\n</CodeGroup>` };
}

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../websocket/quickstart.mdx');
let src = readFileSync(file, 'utf8');
for (const set of SAMPLE_SETS) {
  const start = src.indexOf(set.start);
  const startEnd = src.indexOf('*/}', start) + 3;
  const end = src.indexOf(set.end);
  if (start < 0 || end < 0) {
    console.error(`markers ${set.start} … ${set.end} not found in websocket/quickstart.mdx`);
    process.exit(1);
  }
  const { count, text } = render(set.subscriptions);
  src = `${src.slice(0, startEnd)}\n${text}\n${src.slice(end)}`;
  console.log(`wrote ${count} client samples between ${set.start} … ${set.end} in websocket/quickstart.mdx`);
}
writeFileSync(file, src);
