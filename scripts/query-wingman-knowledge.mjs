#!/usr/bin/env node
// Query layer over parse-wingman-logs.mjs's output -- no new parsing logic, no new data source,
// no database. parse-wingman-logs.mjs already turns LEARNINGS.md/retros.md/PROJECT.md-decisions/
// HUMAN-TODOS.md/GAPS.md into structured JSON, but has no query interface of its own (just a full
// JSON dump) and its recurringCategories() export -- the "has this friction genuinely repeated?"
// signal -- was written but never called anywhere. This script is the thin interface that makes
// that already-parsed data actually queryable, filterable, and importable by other tooling.
//
// Dev-repo-only, same as parse-wingman-logs.mjs: this lives under /scripts, which never ships as
// part of the installed plugin (see docs/ARCHITECTURE.md's structured-knowledge-layer note under
// §6). skills/dogfood-gap-classification may depend on it (dev-repo-only itself); evolve-promotion
// must not (it runs inside any founder's installed project).
//
// Usage: node scripts/query-wingman-knowledge.mjs [--type=T] [--category=C] [--status=S]
//          [--source=learnings,retros,decisions,todos,gaps] [--json]
//        node scripts/query-wingman-knowledge.mjs --recurring[=N] [--json]
//        import { query, recurring } from './query-wingman-knowledge.mjs'

import { parseAll, recurringCategories } from './parse-wingman-logs.mjs';

const ALL_SOURCES = ['learnings', 'retros', 'decisions', 'todos', 'gaps'];

export function query(filters = {}) {
  const { type, category, status, sources = ALL_SOURCES } = filters;
  const all = parseAll();
  const rows = [];
  for (const source of sources) {
    for (const entry of all[source] || []) rows.push({ source, ...entry });
  }
  return rows.filter((r) => {
    if (type && r.type !== type) return false;
    if (category && r.category !== category) return false;
    if (status && r.status !== status) return false;
    return true;
  });
}

export function recurring(minOccurrences = 2) {
  return recurringCategories(minOccurrences);
}

function formatTable(rows) {
  if (rows.length === 0) return '(no matching entries)';
  const cols = ['source', 'type', 'category', 'status', 'occurrence', 'heading'];
  const cell = (r, c) => {
    if (c === 'heading') return `${r.heading || r.name || ''} (${r.file || ''}:${r.line || ''})`;
    const v = r[c];
    return v === null || v === undefined ? '' : String(v);
  };
  const widths = cols.map((c) => Math.max(c.length, ...rows.map((r) => cell(r, c).length)));
  const line = (vals) => vals.map((v, i) => v.padEnd(widths[i])).join(' | ');
  return [line(cols), line(cols.map((_, i) => '-'.repeat(widths[i]))), ...rows.map((r) => line(cols.map((c) => cell(r, c))))].join('\n');
}

function formatRecurringTable(rows) {
  if (rows.length === 0) return '(no category has reached the occurrence threshold)';
  const widths = [Math.max(8, ...rows.map((r) => r.category.length)), 5];
  const line = (a, b) => `${String(a).padEnd(widths[0])} | ${String(b).padEnd(widths[1])}`;
  return [line('category', 'count'), line('-'.repeat(widths[0]), '-'.repeat(widths[1])), ...rows.map((r) => line(r.category, r.count))].join('\n');
}

function parseArgs(argv) {
  const out = { json: false };
  for (const arg of argv) {
    if (arg === '--json') { out.json = true; continue; }
    if (arg === '--recurring') { out.recurring = 2; continue; }
    const m = arg.match(/^--([\w-]+)=(.*)$/);
    if (!m) continue;
    const [, key, val] = m;
    if (key === 'recurring') out.recurring = Number(val);
    else if (key === 'source') out.source = val.split(',').map((s) => s.trim()).filter(Boolean);
    else out[key] = val;
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  if (args.recurring !== undefined) {
    const rows = recurring(args.recurring);
    console.log(args.json ? JSON.stringify(rows, null, 2) : formatRecurringTable(rows));
  } else {
    const rows = query({ type: args.type, category: args.category, status: args.status, sources: args.source });
    console.log(args.json ? JSON.stringify(rows, null, 2) : formatTable(rows));
  }
}
