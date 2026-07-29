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
//     downstream link — either a `wingman:req <ID>` marker elsewhere, or another stage's
//     table row naming it in that row's `Satisfies` column.
//   - every `wingman:req <ID>` marker resolves to an ID that was actually minted
//     somewhere (an "orphaned marker" — the more serious of the two, since it means a
//     task/commit claims to satisfy a requirement that doesn't exist).
//
// CHAIN AWARENESS (added 2026-07-29). Every stage's table carries a `Satisfies` column
// naming the upstream ID(s) that row descends from — the actual vision->code chain. This
// script previously never parsed that column at all: the chain was dead data, and
// "does this code trace back to the vision?" had no mechanical answer. It now builds the
// real graph from those columns, which does two things:
//   1. Removes a documented class of false "unlinked" warning. A DEF-* reachable only via
//      an intermediate ARCH-* row used to warn as unlinked; it no longer does, because the
//      ARCH-* row naming it IS a downstream link.
//   2. Enables `--chain <ID>`, which walks upward to a DISC-* root and reports whether the
//      chain is genuinely unbroken.
//
// Edge extraction is deliberately position-independent: within a minted row, the FIRST ID
// is the row's own, and EVERY other ID in that row is treated as an upstream edge. Column
// order genuinely differs between stages (architecture.md puts Satisfies third of four,
// wireframes.md puts it fourth of four), so counting columns would be fragile. The
// tradeoff: an ID merely mentioned in another cell's prose is read as an edge. That is
// deliberately the safe direction — a spurious edge can only make a chain look MORE
// connected, which suppresses a warning; it can never create an error or a false PASS.
//
// No dependencies beyond Node's stdlib. Orphaned markers are errors; unlinked
// requirements are warnings (a requirement with no downstream link yet might just be
// mid-pipeline, e.g. Define ran but Architecture hasn't yet — only a marker pointing
// nowhere is unambiguously wrong).
//
// Usage: node check-traceability.mjs [path]            # normal check, PASS/FAIL
//        node check-traceability.mjs [path] --chain ID # walk one ID back to the vision
//        node check-traceability.mjs [path] --orphans  # list every break, no PASS/FAIL

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import {
  ID_PATTERN,
  TABLE_ROW_PATTERN,
  MARKER_PATTERN,
  ROOT_PREFIX,
  TERMINAL_PREFIX,
  prefixOf,
} from './traceability-prefixes.mjs';

const argv = process.argv.slice(2);
const chainIndex = argv.indexOf('--chain');
const chainTarget = chainIndex !== -1 ? argv[chainIndex + 1] : null;
const orphansOnly = argv.includes('--orphans');
// Guard the `chainIndex === -1` case explicitly: `-1 + 1` is 0, which would drop argv[0] --
// the target directory -- on every run without --chain, silently checking the cwd instead of
// the project that was asked for. Caught by tests/hooks-integration/traceability-chain.test.mjs.
const chainValueIndex = chainIndex === -1 ? -1 : chainIndex + 1;
const positional = argv.filter((a, i) => !a.startsWith('--') && i !== chainValueIndex);
const root = positional[0] ? resolve(process.cwd(), positional[0]) : process.cwd();

if (chainIndex !== -1 && !chainTarget) {
  console.error('check-traceability: --chain requires an ID, e.g. --chain DEF-001');
  process.exit(2);
}

// 'evals' is Wingman's own internal test-documentation directory, never part
// of a founder's real project structure this script is meant to check -- its
// case docs legitimately need to quote example wingman:req markers as prose
// (e.g. "a marker referencing DEF-999 that was never minted"), which would
// otherwise be indistinguishable from a real marker/definition by this
// script's own deliberately syntax-agnostic regex.
const SKIP_DIRS = new Set(['.git', 'node_modules', 'vendor', '.wingman', 'evals']);
// ID_PATTERN, TABLE_ROW_PATTERN and MARKER_PATTERN now come from ./traceability-prefixes.mjs,
// the one place the 12 prefixes are defined. They used to be hand-written here AND again in
// hooks/dod-structural-gate.mjs, which is exactly how that copy silently fell 7 prefixes
// behind this one after the 14-stage expansion.
const ID_PATTERN_G = new RegExp(ID_PATTERN.source, 'g');

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
const satisfies = new Map(); // id -> Set of upstream ids it descends from
const satisfiedBy = new Map(); // upstream id -> Set of downstream ids naming it

function addEdge(downstream, upstream) {
  if (downstream === upstream) return; // a row naming its own ID is not an edge
  if (!satisfies.has(downstream)) satisfies.set(downstream, new Set());
  satisfies.get(downstream).add(upstream);
  if (!satisfiedBy.has(upstream)) satisfiedBy.set(upstream, new Set());
  satisfiedBy.get(upstream).add(downstream);
}

for (const file of files) {
  let content;
  try { content = readFileSync(file, 'utf-8'); } catch { continue; }
  const relPath = relative(root, file);

  for (const line of content.split('\n')) {
    const tableMatch = line.match(TABLE_ROW_PATTERN);
    if (tableMatch) {
      const idMatch = line.match(ID_PATTERN);
      if (idMatch && !definedIds.has(idMatch[0])) definedIds.set(idMatch[0], relPath);
      // Every ID in the row after the row's own is an upstream (Satisfies) edge.
      // Position-independent by design — see the header note on why column counting
      // would be fragile across stages.
      if (idMatch) {
        ID_PATTERN_G.lastIndex = 0;
        const rowIds = [...line.matchAll(ID_PATTERN_G)].map((m) => m[0]);
        for (const upstream of rowIds.slice(1)) addEdge(idMatch[0], upstream);
      }
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

// Unlinked requirements: defined but nothing downstream points at them. "Downstream" now
// means either a wingman:req marker in another file OR another stage's table row naming
// this ID in its Satisfies column — the second half is what the old marker-only check
// missed, and is why a DEF-* covered solely by an ARCH-* row used to warn spuriously.
for (const [id, definedIn] of definedIds) {
  if (prefixOf(id) === TERMINAL_PREFIX) continue; // IP-* is terminal by design
  const refs = referencedIds.get(id);
  const hasMarkerLink = refs && [...refs].some((f) => f !== definedIn);
  const hasChainLink = satisfiedBy.has(id) && satisfiedBy.get(id).size > 0;
  if (!hasMarkerLink && !hasChainLink) {
    warnings.push(`unlinked requirement: "${id}" (defined in ${definedIn}) has no downstream wingman:req marker and no later stage names it in a Satisfies column yet`);
  }
}

/**
 * Walk upward from `id` through Satisfies edges, collecting every path. Returns
 * { paths, reachesRoot, unknown } — `unknown` is true when the ID was never minted at all.
 * Cycle-safe: a malformed project where A satisfies B and B satisfies A terminates rather
 * than recursing forever.
 */
function walkChain(id, seen = new Set()) {
  if (!definedIds.has(id)) return { paths: [[`${id} (NOT MINTED)`]], reachesRoot: false, unknown: true };
  if (seen.has(id)) return { paths: [[`${id} (cycle)`]], reachesRoot: false, unknown: false };
  const nextSeen = new Set(seen).add(id);
  const parents = [...(satisfies.get(id) || [])];
  if (parents.length === 0) {
    const isRoot = prefixOf(id) === ROOT_PREFIX;
    return { paths: [[id]], reachesRoot: isRoot, unknown: false };
  }
  const paths = [];
  let reachesRoot = false;
  for (const parent of parents) {
    const up = walkChain(parent, nextSeen);
    if (up.reachesRoot) reachesRoot = true;
    for (const p of up.paths) paths.push([id, ...p]);
  }
  return { paths, reachesRoot, unknown: false };
}

if (chainTarget) {
  const { paths, reachesRoot, unknown } = walkChain(chainTarget);
  console.log(`\nChain for ${chainTarget}:`);
  for (const p of paths) console.log(`  ${p.join('  ->  ')}`);
  if (unknown) {
    console.log(`\nBROKEN — "${chainTarget}" was never minted in any table.`);
    process.exit(1);
  }
  if (!reachesRoot) {
    console.log(`\nBROKEN — no path reaches a ${ROOT_PREFIX}-* root, so this does not trace back to the vision.`);
    process.exit(1);
  }
  console.log(`\nTRACED — reaches a ${ROOT_PREFIX}-* root; this descends from the vision.`);
  process.exit(0);
}

if (orphansOnly) {
  const breaks = [...errors];
  for (const id of definedIds.keys()) {
    if (prefixOf(id) === ROOT_PREFIX) continue; // roots have nothing above them
    if (!walkChain(id).reachesRoot) {
      breaks.push(`unrooted: "${id}" (defined in ${definedIds.get(id)}) has no Satisfies path back to a ${ROOT_PREFIX}-* root`);
    }
  }
  console.log(`\n${breaks.length} chain break(s):`);
  for (const b of breaks) console.log(`  - ${b}`);
  process.exit(breaks.length ? 1 : 0);
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
