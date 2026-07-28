#!/usr/bin/env node
// Traceability validator. Ships with the plugin (unlike check-repo-consistency.mjs/
// check-fixtures.mjs at repo root, which only ever run against Wingman's own dev repo)
// because this one is meant to run inside whatever project it's pointed at — normally
// a founder's own project during /wingman:build or the dod-structural-gate.mjs hook,
// invoked as `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-traceability.mjs" <path>` the
// same way hooks reference their own scripts. It's also run from Wingman's own repo
// root as part of this repo's own 4-validator CI suite (alongside validate-structure.mjs,
// check-repo-consistency.mjs, check-fixtures.mjs) — designed to report "nothing to
// check" rather than fail when pointed at a project with no requirement/marker data yet.
//
// What it checks (see plugins/wingman/skills/traceability-linking/SKILL.md):
//   - every requirement/decision/flow ID (DISC-*, RS-*, PJ-*, JM-*, DEF-*, IA-*, UX-*,
//     WF-*, VS-*, PT-*, ARCH-*, IP-*) minted in a markdown table has at least one
//     downstream `wingman:req <ID>` marker elsewhere.
//   - every `wingman:req <ID>` marker resolves to an ID that was actually minted
//     somewhere (an "orphaned marker" — the more serious of the two, since it means a
//     task/commit claims to satisfy a requirement that doesn't exist).
//
// No dependencies beyond Node's stdlib. Orphaned markers are errors; unlinked
// requirements are warnings (a requirement with no downstream link yet might just be
// mid-pipeline, e.g. Define ran but Architecture hasn't yet — only a marker pointing
// nowhere is unambiguously wrong).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : process.cwd();

// 'evals' is Wingman's own internal test-documentation directory, never part
// of a founder's real project structure this script is meant to check -- its
// case docs legitimately need to quote example wingman:req markers as prose
// (e.g. "a marker referencing DEF-999 that was never minted"), which would
// otherwise be indistinguishable from a real marker/definition by this
// script's own deliberately syntax-agnostic regex.
const SKIP_DIRS = new Set(['.git', 'node_modules', 'vendor', '.wingman', 'evals']);
const ID_PATTERN = /\b(DISC|RS|PJ|JM|DEF|IA|UX|WF|VS|PT|ARCH|IP)-\d+\b/;
const TABLE_ROW_PATTERN = /^\s*\|\s*(DISC|RS|PJ|JM|DEF|IA|UX|WF|VS|PT|ARCH|IP)-\d+\s*\|/;
// Matches one `wingman:req` token followed by one or more space-separated IDs on the
// same line -- found via real dogfooding (docs/history/retros.md, 2026-07-15): the
// original single-ID pattern silently dropped every ID after the first when a task
// genuinely satisfied more than one requirement,
// with no warning that anything had been missed.
const MARKER_PATTERN = /wingman:req((?:\s+(?:DISC|RS|PJ|JM|DEF|IA|UX|WF|VS|PT|ARCH|IP)-\d+)+)/g;

function walk(dir, files = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return files; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full, files);
    else if (st.isFile()) files.push(full);
  }
  return files;
}

const files = walk(root);
const definedIds = new Map(); // id -> file it was first defined in
const referencedIds = new Map(); // id -> Set of files that reference it

for (const file of files) {
  let content;
  try { content = readFileSync(file, 'utf-8'); } catch { continue; }
  const relPath = relative(root, file);

  for (const line of content.split('\n')) {
    const tableMatch = line.match(TABLE_ROW_PATTERN);
    if (tableMatch) {
      const idMatch = line.match(ID_PATTERN);
      if (idMatch && !definedIds.has(idMatch[0])) definedIds.set(idMatch[0], relPath);
    }
  }

  let m;
  MARKER_PATTERN.lastIndex = 0;
  while ((m = MARKER_PATTERN.exec(content))) {
    // m[1] may hold one or more space-separated IDs (e.g. " ARCH-002 ARCH-003") when a
    // single wingman:req token covers multiple IDs -- split and record each one.
    for (const id of m[1].trim().split(/\s+/)) {
      if (!referencedIds.has(id)) referencedIds.set(id, new Set());
      referencedIds.get(id).add(relPath);
    }
  }
}

const errors = [];
const warnings = [];

// Staleness detection (additive, warning-only — never a hard failure): if a DEF-*/ARCH-*/UX-*
// source file under docs/wingman/{define,architecture,uxflow}/ has a filesystem mtime newer than
// a plan file under docs/wingman/plans/ that cites its IDs, the plan may have been written (or last
// touched) before that requirement/decision/flow was last edited -- flag it so a founder/agent can
// notice, without blocking the existing PASS/FAIL semantics above.
const STALENESS_SOURCE_DIRS = ['define', 'architecture', 'uxflow'];
const plansDir = join(root, 'docs', 'wingman', 'plans');
let planFiles = [];
try {
  planFiles = readdirSync(plansDir).filter((f) => f.endsWith('.md')).map((f) => join(plansDir, f));
} catch { /* no plans dir -- nothing to check staleness against */ }

if (planFiles.length > 0) {
  for (const dirName of STALENESS_SOURCE_DIRS) {
    const dir = join(root, 'docs', 'wingman', dirName);
    let sourceFiles;
    try { sourceFiles = readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => join(dir, f)); }
    catch { continue; }

    for (const sourceFile of sourceFiles) {
      let sourceContent, sourceMtime;
      try {
        sourceContent = readFileSync(sourceFile, 'utf-8');
        sourceMtime = statSync(sourceFile).mtimeMs;
      } catch { continue; }
      const sourceIds = new Set([...sourceContent.matchAll(new RegExp(TABLE_ROW_PATTERN.source, 'gm'))]
        .map((m) => m[0].match(ID_PATTERN)?.[0])
        .filter(Boolean));
      if (sourceIds.size === 0) continue;

      for (const planFile of planFiles) {
        let planContent, planMtime;
        try {
          planContent = readFileSync(planFile, 'utf-8');
          planMtime = statSync(planFile).mtimeMs;
        } catch { continue; }
        const citesSourceId = [...sourceIds].some((id) => planContent.includes(id));
        if (citesSourceId && sourceMtime > planMtime) {
          warnings.push(
            `stale relationship: "${relative(process.cwd(), sourceFile)}" was modified after ` +
            `"${relative(process.cwd(), planFile)}" was last touched — plan may be based on a stale requirement.`
          );
        }
      }
    }
  }
}

// Orphaned markers: referenced but never defined in any table row.
for (const [id, refFiles] of referencedIds) {
  if (!definedIds.has(id)) {
    errors.push(`orphaned marker: "${id}" is referenced via wingman:req in ${[...refFiles].join(', ')} but was never minted in any requirement/decision/flow table`);
  }
}

// Unlinked requirements: defined but never referenced anywhere else.
for (const [id, definedIn] of definedIds) {
  const refs = referencedIds.get(id);
  const hasDownstreamLink = refs && [...refs].some((f) => f !== definedIn);
  if (!hasDownstreamLink) {
    warnings.push(`unlinked requirement: "${id}" (defined in ${definedIn}) has no downstream wingman:req marker in any other file yet`);
  }
}

console.log(`Traceability: checked ${files.length} file(s) under ${relative(process.cwd(), root) || '.'} — ${definedIds.size} requirement/decision/flow ID(s) minted, ${referencedIds.size} distinct ID(s) referenced`);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  - ${w}`);
}
if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  for (const e of errors) console.log(`  - ${e}`);
  console.log('\nFAIL');
  process.exit(1);
}
console.log('\nPASS');
