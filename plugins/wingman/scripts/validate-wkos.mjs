#!/usr/bin/env node
// WKOS contract validator. Ships with the plugin (like check-traceability.mjs, unlike the
// dev-repo-only root scripts/) because it is meant to run inside a founder's own project as
// well as in Wingman's CI.
//
// Enforces the one rule that keeps a ~130-document knowledge system from becoming dead weight:
// every document has a real producer and a real consumer, or it is a template. See
// references/wkos/README.md for why that specific rule, and wkos-check.mjs for the logic.
//
// Usage: node validate-wkos.mjs            # check the plugin's own WKOS contract
//        node validate-wkos.mjs --summary  # counts only

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkProducerMap, summarize } from './wkos-check.mjs';

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const mapRel = 'references/wkos/producer-map.md';
const mapPath = join(pluginRoot, mapRel);

if (!existsSync(mapPath)) {
  console.error(`FATAL: ${mapRel} not found — the producer map is what makes the WKOS contract checkable`);
  process.exit(1);
}

const text = readFileSync(mapPath, 'utf-8');
const counts = summarize(text);

if (process.argv.includes('--summary')) {
  console.log(JSON.stringify(counts, null, 2));
  process.exit(0);
}

// A path resolves if the file exists, or if it's a skill directory holding a SKILL.md.
const exists = (rel) => existsSync(join(pluginRoot, rel)) || existsSync(join(pluginRoot, rel, 'SKILL.md'));
const problems = checkProducerMap(text, exists);

const backed = counts.produced + counts.existing;
const pct = counts.total ? Math.round((backed / counts.total) * 100) : 0;
console.log(
  `WKOS: ${counts.total} document(s) mapped — ${counts.produced} produced, ${counts.existing} existing, ` +
  `${counts.template} template (${pct}% backed by real machinery)`,
);

if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(`  - ${p}`);
  console.log('\nFAIL');
  process.exit(1);
}

console.log('\nPASS');
