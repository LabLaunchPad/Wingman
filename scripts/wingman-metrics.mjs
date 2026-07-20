#!/usr/bin/env node
// Real, computable efficiency/cost/quality metrics for Wingman's own dev process --
// deliberately NOT a service-style benchmark (no p95 latency, throughput, cache hit
// rate, IOPS: Wingman has no persistent runtime and no request traffic to measure,
// see docs/ARCHITECTURE.md §2). Every number here comes from data this repo already
// has on disk -- no synthetic workload, no invented figures. Same category as
// wingman-health.mjs/query-wingman-knowledge.mjs: dev-repo-only, read-only, never
// shipped as part of the installed plugin (docs/ARCHITECTURE.md §6a).
//
// Usage: node scripts/wingman-metrics.mjs [--json]

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { recurringCategories } from './parse-wingman-logs.mjs';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (rel) => { try { return readFileSync(join(repoRoot, rel), 'utf-8'); } catch { return null; } };

// Same frontmatter parser as plugins/wingman/scripts/validate-structure.mjs --
// tolerates CRLF, strips one layer of quotes so `model: "opus"` and `model: opus`
// parse identically.
function parseFrontmatter(filePath) {
  const text = readFileSync(filePath, 'utf-8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const fieldMatch = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (fieldMatch) {
      const raw = fieldMatch[2].trim();
      fields[fieldMatch[1]] = raw.replace(/^(["'])(.*)\1$/, '$2');
    }
  }
  return fields;
}

// --- 1. Cost-shape: model-tier distribution across the 8 Boardroom seats ---
// This is Wingman's real, deliberate cost-control lever (docs/ARCHITECTURE.md §8's
// risk-cost model tiering) -- a genuine cost-efficiency signal, not a proxy.
const agentsDir = join(repoRoot, 'plugins/wingman/agents');
const agentFiles = existsSync(agentsDir) ? readdirSync(agentsDir).filter((f) => f.endsWith('.md')) : [];
const tierCounts = { opus: 0, inherit: 0, haiku: 0, other: 0 };
const tierByAgent = {};
for (const f of agentFiles) {
  const fm = parseFrontmatter(join(agentsDir, f));
  const model = fm?.model ?? 'unset';
  const bucket = ['opus', 'inherit', 'haiku'].includes(model) ? model : 'other';
  tierCounts[bucket] += 1;
  tierByAgent[f.replace(/\.md$/, '')] = model;
}

// --- 2. Eval-suite quality snapshot (verified/provisional ratio) ---
// Deliberately a snapshot, not a trend: CHANGELOG.md has no structured marker for
// "case X promoted to verified on date Y" (checked -- free prose only), and parsing
// a trend out of unstructured text would risk exactly the fabricated-signal problem
// this script exists to avoid. The snapshot itself is exact.
const caseDir = 'evals/cases';
const cases = existsSync(join(repoRoot, caseDir)) ? readdirSync(join(repoRoot, caseDir)).filter((f) => f.endsWith('.md')) : [];
let verified = 0, provisional = 0;
for (const f of cases) {
  const body = read(join(caseDir, f)) || '';
  const after = body.split(/##\s*Trust level/i)[1] || '';
  const m = after.match(/`(verified|provisional)`/i);
  if (m?.[1].toLowerCase() === 'verified') verified += 1;
  else if (m?.[1].toLowerCase() === 'provisional') provisional += 1;
}
const pctVerified = cases.length ? Math.round((verified / cases.length) * 100) : 0;

// --- 3. Technical-debt ceiling rate, from DEBT.md if one exists ---
// DEBT.md is generated per founder project by /wingman:debt-ledger (see
// plugins/wingman/commands/debt-ledger.md) -- Wingman's own dev repo has none today,
// which is expected, not a gap. Report N/A rather than fabricating a rate.
const debtBody = read('DEBT.md');
let debtSummary = 'N/A -- no DEBT.md in this repo (expected: DEBT.md is generated per founder project by /wingman:build, not by Wingman\'s own dev process)';
let debtRows = [];
if (debtBody) {
  const rows = [...debtBody.matchAll(/^\|\s*(D\d+)\s*\|.*\|\s*(OPEN|CLOSED|HIT)\s*\|?\s*$/gim)];
  debtRows = rows.map((r) => ({ id: r[1], status: r[2].toUpperCase() }));
  const open = debtRows.filter((r) => r.status !== 'CLOSED').length;
  const hit = debtRows.filter((r) => r.status === 'HIT').length;
  debtSummary = debtRows.length
    ? `${debtRows.length} tracked shortcuts, ${open} open, ${hit} at/past ceiling`
    : 'DEBT.md exists but no parseable rows found';
}

// --- 4. Occurrence-threshold visibility ---
// Thin wrapper around the existing recurringCategories() export -- no new parsing.
const recurring = recurringCategories();

// --- 5. Agent-weakness coverage benchmark ---
// Parses docs/AGENT-WEAKNESS-BENCHMARK.md's `wingman:weakness` markers, then
// RE-DERIVES each one's real status from disk rather than trusting the marker's
// hand-written status: does the rule= path exist, and is the eval= case actually
// `verified`? Flags any marker whose written status disagrees, plus any broken
// path. The benchmark verifies its own claims (verification-before-completion
// applied to the benchmark itself) so the catalog can't silently rot/overstate.
function evalTrustLevel(evalRel) {
  const body = read(evalRel);
  if (body === null) return null; // missing file
  const after = body.split(/##\s*Trust level/i)[1] || '';
  const m = after.match(/`(verified|provisional)`/i);
  return m ? m[1].toLowerCase() : 'authored';
}

const WEAKNESS_MARKER_RE = /<!--\s*wingman:weakness\s+(.*?)\s*-->/g;
const weaknessBody = read('docs/AGENT-WEAKNESS-BENCHMARK.md') || '';
const weaknesses = [];
for (const match of weaknessBody.matchAll(WEAKNESS_MARKER_RE)) {
  const attrs = {};
  for (const a of match[1].matchAll(/(\w+)=(?:"([^"]*)"|(\S+))/g)) attrs[a[1]] = a[2] ?? a[3];
  // Skip the literal `<!-- wingman:weakness ... -->` examples shown in this doc's
  // own prose: real catalog markers always carry an id=W<number>.
  if (!/^W\d+$/.test(attrs.id || '')) continue;
  const rule = attrs.rule || '';
  const evalRef = attrs.eval || '';
  const writtenStatus = attrs.status || '';
  const hasRule = rule !== '' && existsSync(join(repoRoot, rule));
  const ruleBroken = rule !== '' && !hasRule;
  const evalTrust = evalRef !== '' ? evalTrustLevel(evalRef) : null;
  const evalBroken = evalRef !== '' && evalTrust === null;
  const measured = hasRule && evalTrust === 'verified';
  const derivedStatus = !hasRule ? 'uncovered' : (measured ? 'covered-measured' : 'covered-unmeasured');
  weaknesses.push({
    id: attrs.id || '?', rule, evalRef, writtenStatus, derivedStatus,
    ruleBroken, evalBroken, mismatch: writtenStatus !== derivedStatus,
  });
}
const wTotal = weaknesses.length;
const wCovered = weaknesses.filter((w) => w.derivedStatus !== 'uncovered').length;
const wMeasured = weaknesses.filter((w) => w.derivedStatus === 'covered-measured').length;
const wUncovered = wTotal - wCovered;
const brokenRefs = weaknesses.filter((w) => w.ruleBroken || w.evalBroken);
const mismatches = weaknesses.filter((w) => w.mismatch);
const pctCovered = wTotal ? Math.round((wCovered / wTotal) * 100) : 0;
const pctMeasured = wTotal ? Math.round((wMeasured / wTotal) * 100) : 0;

// --- Report ---
const asJson = process.argv.includes('--json');
if (asJson) {
  console.log(JSON.stringify({ tierCounts, tierByAgent, evalSnapshot: { total: cases.length, verified, provisional, pctVerified }, debt: { summary: debtSummary, rows: debtRows }, recurring, weaknessBenchmark: { total: wTotal, covered: wCovered, measured: wMeasured, uncovered: wUncovered, pctCovered, pctMeasured, brokenRefs: brokenRefs.map((w) => w.id), mismatches: mismatches.map((w) => ({ id: w.id, written: w.writtenStatus, derived: w.derivedStatus })), weaknesses } }, null, 2));
} else {
  const line = (s = '') => console.log(s);
  line('# Wingman Metrics — cost, quality, and debt signals (not a service benchmark)');
  line();
  line('This is NOT p95 latency / throughput / cache-hit-rate / IOPS: Wingman has no');
  line('persistent runtime and no request traffic to instrument (see docs/ARCHITECTURE.md');
  line('§2). Every number below is computed from real files already in this repo.');
  line();
  line('## 1. Cost shape (Boardroom seat model-tier distribution)');
  line(`   opus: ${tierCounts.opus}   inherit: ${tierCounts.inherit}   haiku: ${tierCounts.haiku}${tierCounts.other ? `   other/unset: ${tierCounts.other}` : ''}  (${agentFiles.length} seats total)`);
  line();
  line('## 2. Eval-suite quality snapshot');
  line(`   ${cases.length} cases — ${verified} verified (${pctVerified}%), ${provisional} provisional`);
  line();
  line('## 3. Technical-debt ceiling rate');
  line(`   ${debtSummary}`);
  line();
  line('## 4. Occurrence-threshold visibility');
  line(recurring.length
    ? `   ${recurring.length} categor${recurring.length === 1 ? 'y has' : 'ies have'} crossed the 2+-occurrence evolve-promotion threshold: ${recurring.map((r) => `${r.category} ×${r.count}`).join(', ')}`
    : '   No category has crossed the 2+-occurrence threshold yet.');
  line();
  line('## 5. Agent-weakness coverage benchmark (docs/AGENT-WEAKNESS-BENCHMARK.md)');
  if (wTotal === 0) {
    line('   No wingman:weakness markers found — catalog missing or empty.');
  } else {
    line(`   Cataloged weaknesses:                    ${wTotal}`);
    line(`   Covered by a rule:                       ${wCovered}/${wTotal} (${pctCovered}%)`);
    line(`   Measured by a verified eval (incl. A/B): ${wMeasured}/${wTotal} (${pctMeasured}%)`);
    line(`   Uncovered (evidence-gated candidates):   ${wUncovered}`);
    line(`   Broken references: ${brokenRefs.length}${brokenRefs.length ? ` (${brokenRefs.map((w) => w.id).join(', ')})` : ''}   Status mismatches: ${mismatches.length}${mismatches.length ? ` (${mismatches.map((w) => `${w.id}: wrote ${w.writtenStatus}, derived ${w.derivedStatus}`).join('; ')})` : ''}`);
  }
}
