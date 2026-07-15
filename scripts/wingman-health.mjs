#!/usr/bin/env node
// Wingman dev-health telemetry: a proven, zero-infrastructure pattern — a
// status report computed over the flat files that already exist (plugin.json,
// evals/, docs/), no server, no database, no network. Answers "how healthy is
// this repo right now" at a glance: what's built, what's actually been
// behaviorally verified vs. only structurally validated, and where the
// coverage gaps are. Run it any time; it reads, never writes.
//
// This is the local half of the telemetry story. The cross-repo half (how a
// founder's own project's learnings can flow back to improve Wingman) is the
// opt-in convention in docs/CROSS-USER-LEARNING.md — also flat-file and
// human-gated, no phone-home.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAll, recurringCategories } from './parse-wingman-logs.mjs';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (rel) => { try { return readFileSync(join(repoRoot, rel), 'utf-8'); } catch { return null; } };

const plugin = JSON.parse(read('plugins/wingman/.claude-plugin/plugin.json'));
const commands = (plugin.commands || []).map((p) => p.split('/').pop().replace(/\.md$/, ''));
const skills = (plugin.skills || []).map((p) => p.split('/').pop());
const agents = (plugin.agents || []).map((p) => p.split('/').pop().replace(/\.md$/, ''));

// --- Eval coverage ---
const caseDir = 'evals/cases';
const cases = existsSync(join(repoRoot, caseDir)) ? readdirSync(join(repoRoot, caseDir)).filter((f) => f.endsWith('.md')) : [];
const trust = {}; // caseName -> 'verified' | 'provisional' | 'unknown'
for (const f of cases) {
  const body = read(join(caseDir, f)) || '';
  const after = body.split(/##\s*Trust level/i)[1] || '';
  const m = after.match(/`(verified|provisional)`/i);
  trust[f.replace(/\.md$/, '')] = m ? m[1].toLowerCase() : 'unknown';
}
const verified = Object.values(trust).filter((t) => t === 'verified').length;
const provisional = Object.values(trust).filter((t) => t === 'provisional').length;

// A case "covers" a command/skill if its filename equals that name or extends
// it with a suffix (e.g. "boardroom-gate-rule" covers "boardroom",
// "evolve-promotion" covers both the "evolve" command and the skill).
const caseNames = Object.keys(trust);
const isCovered = (name) => caseNames.some((c) => c === name || c.startsWith(name + '-'));
const uncoveredCommands = commands.filter((c) => !isCovered(c));
const uncoveredSkills = skills.filter((s) => !isCovered(s));

// --- Learnings/decisions volume, from the structured wingman:log markers, not a prose regex ---
const logs = parseAll();
const decisionCount = logs.decisions.length;
const recurring = recurringCategories();

// --- Report ---
const line = (s = '') => console.log(s);
line('# Wingman Dev-Health Report');
line();
line(`Plugin surface:   ${commands.length} commands, ${agents.length} boardroom seats, ${skills.length} skills`);
line(`Eval cases:       ${cases.length} total — ${verified} verified, ${provisional} provisional${cases.length - verified - provisional ? `, ${cases.length - verified - provisional} unknown` : ''}`);
line(`Decisions logged: ${decisionCount} durable decisions in docs/PROJECT.md`);
line();
line('Behavioral eval coverage by trust level:');
for (const [name, t] of Object.entries(trust).sort()) {
  const mark = t === 'verified' ? '✔ verified   ' : t === 'provisional' ? '~ provisional' : '? unknown    ';
  line(`  ${mark} ${name}`);
}
line();
if (uncoveredCommands.length) line(`Commands with no dedicated eval case (${uncoveredCommands.length}): ${uncoveredCommands.join(', ')}`);
if (uncoveredSkills.length) line(`Skills with no dedicated eval case (${uncoveredSkills.length}): ${uncoveredSkills.join(', ')}`);
line();
const { totalHeadings, markedHeadings } = logs.coverage;
const pctMarked = totalHeadings ? Math.round((markedHeadings / totalHeadings) * 100) : 100;
line(`Structural log coverage: ${markedHeadings}/${totalHeadings} entries (${pctMarked}%) across LEARNINGS.md/retros.md/PROJECT.md-decisions/HUMAN-TODOS.md carry a machine-parseable wingman:log marker (see scripts/parse-wingman-logs.mjs).`);
line(`Recurring themes: ${recurring.length} categor${recurring.length === 1 ? 'y has' : 'ies have'} 2+ occurrences across learnings/retros/decisions${recurring.length && recurring.length <= 5 ? ` (${recurring.map((r) => `${r.category} ×${r.count}`).join(', ')})` : ''} — see scripts/query-wingman-knowledge.mjs.`);
line();
// Overall one-line verdict, in the plain-language spirit the project holds
// its own outputs to.
const pctVerified = cases.length ? Math.round((verified / cases.length) * 100) : 0;
line(`Bottom line: ${cases.length} behaviors have a real eval; ${pctVerified}% are verified (2+ scenarios), the rest provisional (1 scenario). ${uncoveredCommands.length + uncoveredSkills.length} plugin pieces have no dedicated case yet (see docs/PROJECT.md for which are deliberately deferred vs. genuinely open).`);
