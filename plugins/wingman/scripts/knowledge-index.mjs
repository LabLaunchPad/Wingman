#!/usr/bin/env node
// Knowledge Engine searchability layer (PR8 of the AI Engineering Operating System build).
// A generated index over references/ plus a zero-dependency query script -- same shape as
// scripts/query-founder-knowledge.mjs (no embeddings, no ranking model, no network call).
//
// Semantic/vector search deliberately stays out of the shipped plugin: install-smoke.yml asserts
// node_modules never appears, so an embedding dependency would break a CI-enforced invariant. The
// semantic variant already exists in agnostic-boardroom/ (LanceDB + FastEmbed) and is the right
// home for it -- see docs/status/ENGINES.md's Knowledge Engine entry.
//
// Split from the I/O for the same reason constitution-check.mjs/wkos-check.mjs are: a script that
// runs its whole pass at import time cannot be tested without executing it as a side effect.
//
// Usage: node knowledge-index.mjs "<query>"          # search plugin references/
//        node knowledge-index.mjs "<query>" --json   # machine-readable output

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @param {string} text  a reference doc's raw contents
 * @returns {{ title: string, headings: string[] }}
 */
export function parseDoc(text) {
  const lines = text.split('\n');
  let title = '';
  const headings = [];
  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)/);
    if (h1 && !title) {
      title = h1[1].trim();
      continue;
    }
    const h2plus = line.match(/^#{2,6}\s+(.+)/);
    if (h2plus) headings.push(h2plus[1].trim());
  }
  return { title: title || '(untitled)', headings };
}

/**
 * @param {Array<{ path: string, text: string }>} docs  raw doc contents keyed by relative path
 * @returns {Array<{ path: string, title: string, headings: string[] }>}
 */
export function buildIndex(docs) {
  return docs.map(({ path, text }) => ({ path, ...parseDoc(text) }));
}

function score(entry, queryWords) {
  let s = 0;
  const titleLower = entry.title.toLowerCase();
  const headingsLower = entry.headings.join(' ').toLowerCase();
  const pathLower = entry.path.toLowerCase();
  for (const w of queryWords) {
    if (titleLower.includes(w)) s += 3;
    if (headingsLower.includes(w)) s += 2;
    if (pathLower.includes(w)) s += 1;
  }
  return s;
}

/**
 * @param {Array<{ path: string, title: string, headings: string[] }>} index
 * @param {string} query
 * @returns {Array<{ path: string, title: string, score: number, matchedHeadings: string[] }>}
 *   sorted descending by score; entries scoring 0 are excluded
 */
export function searchIndex(index, query) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return [];

  const results = [];
  for (const entry of index) {
    const s = score(entry, queryWords);
    if (s === 0) continue;
    const matchedHeadings = entry.headings.filter((h) =>
      queryWords.some((w) => h.toLowerCase().includes(w))
    );
    results.push({ path: entry.path, title: entry.title, score: s, matchedHeadings });
  }
  return results.sort((a, b) => b.score - a.score);
}

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function collectReferenceDocs(referencesDir) {
  let entries;
  try {
    entries = readdirSync(referencesDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const docs = [];
  for (const entry of entries) {
    if (entry.isDirectory() || !entry.name.endsWith('.md')) continue;
    const full = join(referencesDir, entry.name);
    docs.push({ path: relative(pluginRoot, full), text: readFileSync(full, 'utf-8') });
  }
  return docs;
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const query = args.filter((a) => a !== '--json').join(' ');

  if (!query) {
    console.error('Usage: node knowledge-index.mjs "<query>" [--json]');
    process.exit(2);
  }

  const docs = collectReferenceDocs(join(pluginRoot, 'references'));
  const index = buildIndex(docs);
  const results = searchIndex(index, query);

  if (jsonMode) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (results.length === 0) {
    console.log(`No matches for "${query}" across ${index.length} reference doc(s).`);
    return;
  }
  console.log(`${results.length} match(es) for "${query}":\n`);
  for (const r of results) {
    console.log(`  ${r.path} — ${r.title} (score ${r.score})`);
    for (const h of r.matchedHeadings) console.log(`    § ${h}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
