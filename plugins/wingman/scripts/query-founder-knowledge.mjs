#!/usr/bin/env node
// PROTOTYPE (evidence-gated, not yet wired into any skill/command) -- the
// founder-project-scoped equivalent of the dev-repo-only scripts/query-
// wingman-knowledge.mjs. Ships with the plugin (lives under plugins/wingman/
// scripts/, unlike its dev-repo-only cousin) because it's meant to run inside
// a founder's own installed project, over that project's own .wingman/ state.
//
// Directly answers docs/DATABASE.md's named gap: "No single file or view
// here unifies checkpoints.jsonl, state.json, traceability.json, and
// memory/*.md into one 'what has this project decided and why' surface."
// Built per docs/wingman/architecture-audit-2026-07-15.md's Emerging finding
// #6 (Confidence: Medium) -- explicitly a bounded prototype to be graded
// honestly before any broader commitment (skill/command wrapper), per that
// audit's own Migration Strategy. See docs/PROJECT.md's decisions log for
// the run log.
//
// Read-only. No writes, no network, no dependencies beyond Node's stdlib.
// Reuses okf-export.mjs's existing checkpoints.jsonl / memory-file parsers
// rather than re-implementing them (the exact duplication risk this
// project's own architecture audit flags when NOT done).
//
// Usage: node query-founder-knowledge.mjs <project-dir> [--source=checkpoints,decisions,tried,memory,traceability,state]
//          [--stage=S] [--verdict=V] [--since=YYYY-MM-DD] [--json]
//        node query-founder-knowledge.mjs <project-dir> --summary [--json]

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readCheckpoints, readMemoryFile } from './okf-export.mjs';

const ALL_SOURCES = ['checkpoints', 'decisions', 'tried', 'memory', 'traceability', 'state'];

function readJsonFile(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`query-founder-knowledge: skipping malformed ${filePath}: ${err.message}`);
    return null;
  }
}

// decisions.md / tried.md are freeform prose per skills/knowledge/memory's own SKILL.md (no strict
// schema) -- parse defensively. The convention that skill documents is "- YYYY-MM-DD: text", but a
// line missing the leading date is still surfaced (undated) rather than silently dropped, since a
// human wrote it and it's still real content worth returning.
function parseDatedBullets(content, source) {
  if (!content) return [];
  const entries = [];
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line.startsWith('-')) continue;
    const body = line.replace(/^-\s*/, '');
    const m = body.match(/^(\d{4}-\d{2}-\d{2}):\s*(.*)$/);
    if (m) entries.push({ source, date: m[1], text: m[2] });
    else entries.push({ source, date: null, text: body });
  }
  return entries;
}

function checkpointToEntry(checkpoint) {
  const stage = Array.isArray(checkpoint.stage) ? checkpoint.stage.join(', ') : checkpoint.stage;
  const date = String(checkpoint.checkpoint_id || '').match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || null;
  return {
    source: 'checkpoints',
    date,
    stage,
    bundle: checkpoint.bundle || null,
    bottom_line: checkpoint.bottom_line || null,
    founder_decision: checkpoint.founder_decision || null,
    next_stage: checkpoint.next_stage || null,
    text: `[${checkpoint.bottom_line || 'unknown'}] ${stage || checkpoint.bundle || 'checkpoint'}` +
      (checkpoint.founder_notes ? ` — ${checkpoint.founder_notes}` : ''),
  };
}

// Collects every source into one normalized, chronologically-sortable list. This is the actual
// answer to "what has this project decided and why" -- one array, not four files in three formats.
export function unify(projectDir) {
  const entries = [];

  for (const checkpoint of readCheckpoints(projectDir)) {
    entries.push(checkpointToEntry(checkpoint));
  }

  const decisions = readMemoryFile(projectDir, 'decisions.md');
  if (decisions.exists) entries.push(...parseDatedBullets(decisions.content, 'decisions'));

  const tried = readMemoryFile(projectDir, 'tried.md');
  if (tried.exists) entries.push(...parseDatedBullets(tried.content, 'tried'));

  const memory = readMemoryFile(projectDir, 'MEMORY.md');
  if (memory.exists) {
    for (const rawLine of memory.content.split('\n')) {
      const line = rawLine.trim();
      if (line.startsWith('-')) entries.push({ source: 'memory', date: null, text: line.replace(/^-\s*/, '') });
    }
  }

  const traceability = readJsonFile(join(projectDir, '.wingman', 'traceability.json'));
  if (traceability?.next_id) {
    for (const [prefix, nextId] of Object.entries(traceability.next_id)) {
      entries.push({ source: 'traceability', date: null, text: `${prefix}: next ID ${nextId} (${nextId - 1} minted)` });
    }
  }

  const state = readJsonFile(join(projectDir, '.wingman', 'state.json'));
  if (state) {
    entries.push({
      source: 'state',
      date: state.updated_at ? String(state.updated_at).slice(0, 10) : null,
      text: `current_stage=${state.current_stage || 'unknown'}, active_department_leads=${(state.active_department_leads || []).length}, active_managers=${(state.active_managers || []).length}, active_specialists=${(state.active_specialists || []).length}`,
    });
  }

  return entries;
}

export function query(projectDir, filters = {}) {
  const { source, stage, verdict, since, sources = ALL_SOURCES } = filters;
  const wantedSources = source ? source.split(',').map((s) => s.trim()) : sources;
  let rows = unify(projectDir).filter((r) => wantedSources.includes(r.source));
  if (stage) rows = rows.filter((r) => r.stage === stage);
  if (verdict) rows = rows.filter((r) => r.bottom_line === verdict);
  if (since) rows = rows.filter((r) => r.date && r.date >= since);
  return rows.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}

// The one-shot "what has this project decided and why" overview -- the direct answer to
// docs/DATABASE.md's named gap, read in one call instead of four files in three formats.
export function summary(projectDir) {
  const all = unify(projectDir);
  const checkpoints = all.filter((r) => r.source === 'checkpoints');
  const lastCheckpoint = checkpoints[checkpoints.length - 1] || null;
  const stateEntry = all.find((r) => r.source === 'state');
  const state = readJsonFile(join(projectDir, '.wingman', 'state.json'));

  // Found via real multi-session dogfooding (docs/PROJECT.md decisions log, 2026-07-21): a session
  // that forgets to update state.json after writing a checkpoint leaves current_stage silently
  // stale -- exactly the kind of drift this whole unification exists to catch, so flag it rather
  // than reporting current_stage at face value.
  let stateStageMismatch = null;
  if (state && lastCheckpoint?.next_stage && state.current_stage !== lastCheckpoint.next_stage) {
    stateStageMismatch = `state.json says current_stage="${state.current_stage}" but the last checkpoint's next_stage is "${lastCheckpoint.next_stage}" -- state.json may not have been updated after that checkpoint`;
  }

  return {
    project_dir: projectDir,
    has_wingman_state: existsSync(join(projectDir, '.wingman')),
    total_entries: all.length,
    by_source: Object.fromEntries(ALL_SOURCES.map((s) => [s, all.filter((r) => r.source === s).length])),
    current_state: stateEntry ? stateEntry.text : null,
    state_stage_mismatch: stateStageMismatch,
    last_checkpoint: lastCheckpoint ? { stage: lastCheckpoint.stage, bottom_line: lastCheckpoint.bottom_line, next_stage: lastCheckpoint.next_stage, date: lastCheckpoint.date } : null,
    recent_decisions: all.filter((r) => r.source === 'decisions').slice(-3),
  };
}

function formatTable(rows) {
  if (rows.length === 0) return '(no matching entries)';
  const cols = ['source', 'date', 'text'];
  const widths = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c] ?? '').length)));
  const line = (vals) => vals.map((v, i) => String(v).padEnd(widths[i])).join(' | ');
  return [line(cols), line(cols.map((_, i) => '-'.repeat(widths[i]))), ...rows.map((r) => line(cols.map((c) => r[c] ?? '')))].join('\n');
}

function parseArgs(argv) {
  const out = { json: false, summary: false };
  const positional = [];
  for (const arg of argv) {
    if (arg === '--json') { out.json = true; continue; }
    if (arg === '--summary') { out.summary = true; continue; }
    const m = arg.match(/^--([\w-]+)=(.*)$/);
    if (m) { out[m[1]] = m[2]; continue; }
    positional.push(arg);
  }
  out.projectDir = positional[0];
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.projectDir) {
    console.error('Usage: node query-founder-knowledge.mjs <project-dir> [--summary] [--source=...] [--stage=S] [--verdict=V] [--since=YYYY-MM-DD] [--json]');
    process.exit(1);
  }
  if (args.summary) {
    console.log(JSON.stringify(summary(args.projectDir), null, 2));
  } else {
    const rows = query(args.projectDir, { source: args.source, stage: args.stage, verdict: args.verdict, since: args.since });
    console.log(args.json ? JSON.stringify(rows, null, 2) : formatTable(rows));
  }
}
