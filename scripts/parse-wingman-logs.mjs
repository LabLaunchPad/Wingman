#!/usr/bin/env node
// Structured, machine-readable view over Wingman's own prose learning/retro/decision/todo logs.
//
// LEARNINGS.md, docs/wingman/retros.md, docs/PROJECT.md's decisions log, and docs/HUMAN-TODOS.md
// are genuinely rich human narrative, but until now had zero machine-parseable fields -- every
// consumer (wingman-health.mjs, evolve-promotion, dogfood-gap-classification) had to either
// re-read prose by eye or write another one-off regex against headings. This script reads the
// `<!-- wingman:log type=... category=... status=... occurrence=N -->` marker that now precedes
// every entry in those four files (additive only -- the prose itself is untouched), plus
// docs/wingman/GAPS.md's already-structured table, and emits one JSON view. Read-only, flat-file,
// no network -- same philosophy as wingman-health.mjs.
//
// Usage: node scripts/parse-wingman-logs.mjs        (pretty JSON to stdout)
//        import { parseAll } from './parse-wingman-logs.mjs'  (programmatic use)

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (rel) => { try { return readFileSync(join(repoRoot, rel), 'utf-8'); } catch { return null; } };

const MARKER_RE = /^<!--\s*wingman:log\s+(.*?)\s*-->$/;

// `category` is documented as free-text, so a bare \S+ value would silently truncate at the
// first space (e.g. "category=ci cd" would drop "cd" instead of erroring) -- support a quoted
// form ("category=\"ci cd\"") for any value that needs a space, found during Boardroom review.
function parseFields(fieldStr) {
  const fields = {};
  const re = /(\w+)=(?:"([^"]*)"|(\S+))/g;
  let m;
  while ((m = re.exec(fieldStr))) fields[m[1]] = m[2] !== undefined ? m[2] : m[3];
  return fields;
}

// Extracts a short heading/summary from the line(s) immediately following a marker.
function headingFrom(line) {
  // Strip leading heading/bullet/numbered-list syntax and bold markers, keep it short.
  const stripped = line.replace(/^#{1,6}\s*/, '').replace(/^-\s*/, '').replace(/^\d+\.\s*/, '');
  const boldMatch = stripped.match(/\*\*(.+?)\*\*/);
  const text = boldMatch ? boldMatch[1] : stripped;
  return text.length > 120 ? text.slice(0, 117) + '...' : text;
}

// Each file has its own idea of what an "entry" is (LEARNINGS.md: every ### date heading;
// retros.md: every ## Retro: heading; PROJECT.md: only the `- **` bullets inside the Decisions
// log section, not the section headers or the unrelated "Built and merged" list above it;
// HUMAN-TODOS.md: every top-level bullet/numbered item, not its subsection headers). A single
// universal pattern over-counts section dividers as if they needed a marker too.
const ENTRY_MATCHERS = {
  'LEARNINGS.md': (l) => /^###\s/.test(l),
  'docs/wingman/retros.md': (l) => /^##\s*Retro:/.test(l),
  'docs/HUMAN-TODOS.md': (l) => /^- \*\*/.test(l) || /^- ~~/.test(l) || /^\d+\.\s*\*\*/.test(l),
  'docs/PROJECT.md': (l) => /^- \*\*/.test(l),
};

function parseMarkedFile(relPath) {
  const text = read(relPath);
  if (text === null) return { entries: [], totalHeadings: 0, markedHeadings: 0 };

  const lines = text.split('\n');
  const isEntryLine = ENTRY_MATCHERS[relPath] || (() => false);
  // PROJECT.md's decisions log is one section among several -- only count within its bounds.
  let scopeStart = 0, scopeEnd = lines.length;
  if (relPath === 'docs/PROJECT.md') {
    scopeStart = lines.findIndex((l) => l.trim() === '## Decisions log');
    const roadmapIdx = lines.findIndex((l, i) => i > scopeStart && l.trim() === '## Roadmap');
    scopeEnd = roadmapIdx === -1 ? lines.length : roadmapIdx;
  }

  const entries = [];
  let markedHeadings = 0;
  let totalHeadings = 0;

  for (let i = 0; i < lines.length; i++) {
    const marker = lines[i].match(MARKER_RE);
    if (marker) {
      const fields = parseFields(marker[1]);
      const next = lines[i + 1] || '';
      entries.push({
        file: relPath,
        line: i + 2, // 1-indexed line of the entry itself, not the marker
        type: fields.type || 'unknown',
        category: fields.category || null,
        status: fields.status || null,
        occurrence: fields.occurrence ? Number(fields.occurrence) : null,
        heading: headingFrom(next),
      });
      if (i >= scopeStart && i < scopeEnd && isEntryLine(next)) markedHeadings++;
    }
  }
  for (let i = scopeStart; i < scopeEnd; i++) if (isEntryLine(lines[i])) totalHeadings++;

  return { entries, totalHeadings, markedHeadings };
}

function parseGapsTable() {
  const text = read('docs/wingman/GAPS.md');
  if (text === null) return [];
  const lines = text.split('\n');
  const gaps = [];
  let inTable = false;
  for (const line of lines) {
    if (/^\|\s*id\s*\|/.test(line)) { inTable = true; continue; }
    if (inTable && /^\|\s*-+/.test(line)) continue; // separator row
    if (inTable) {
      if (!line.trim().startsWith('|')) { inTable = false; continue; }
      const cells = line.split('|').map((c) => c.trim()).filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === ''));
      if (cells.length >= 5) {
        gaps.push({ id: cells[0], category: cells[1], name: cells[2], priority: cells[3], status: cells[4] });
      }
    }
  }
  return gaps;
}

export function parseAll() {
  const learnings = parseMarkedFile('LEARNINGS.md');
  const retros = parseMarkedFile('docs/wingman/retros.md');
  const decisions = parseMarkedFile('docs/PROJECT.md');
  const todos = parseMarkedFile('docs/HUMAN-TODOS.md');
  const gaps = parseGapsTable();

  const totalHeadings = learnings.totalHeadings + retros.totalHeadings + decisions.totalHeadings + todos.totalHeadings;
  const markedHeadings = learnings.markedHeadings + retros.markedHeadings + decisions.markedHeadings + todos.markedHeadings;

  return {
    learnings: learnings.entries,
    retros: retros.entries,
    decisions: decisions.entries,
    todos: todos.entries,
    gaps,
    coverage: { totalHeadings, markedHeadings },
  };
}

// Mechanical occurrence-counting helper for evolve-promotion / dogfood-gap-classification: groups
// all learning/retro/decision entries by category and returns categories with 2+ occurrences --
// the exact "genuine repetition" signal those skills need, computed from real fields instead of
// eyeballing prose.
export function recurringCategories(minOccurrences = 2) {
  const { learnings, retros, decisions } = parseAll();
  const counts = {};
  for (const e of [...learnings, ...retros, ...decisions]) {
    if (!e.category) continue;
    counts[e.category] = (counts[e.category] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, n]) => n >= minOccurrences)
    .map(([category, count]) => ({ category, count }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(parseAll(), null, 2));
}
