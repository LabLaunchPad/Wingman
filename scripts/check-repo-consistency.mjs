#!/usr/bin/env node
// Repo-level consistency checker (complements plugins/wingman/scripts/
// validate-structure.mjs). The plugin validator checks invariants *inside*
// the shipped plugin; this checks invariants that span repo-root files which
// never ship (CLAUDE.md, docs/, ATTRIBUTIONS.md, vendor/). Both are the
// "hybrid template" for regression prevention: mechanize what's crisp here,
// route the genuinely-semantic checks to the systematic-auditing skill.
//
// Each check targets a real regression this project actually hit:
//   - doc-drift: CLAUDE.md once omitted launch/hotfix from its command list.
//   - attribution: ATTRIBUTIONS.md once claimed a vendored repo had "no
//     LICENSE file" when it actually declared MIT.
//
// No dependencies beyond Node's stdlib. Warnings don't fail; errors do.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAll } from './parse-wingman-logs.mjs';
import { buildManifest, renderManifest } from './generate-eval-manifest.mjs';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const errors = [];
const warnings = [];

function read(rel) {
  try { return readFileSync(join(repoRoot, rel), 'utf-8'); } catch { return null; }
}

// --- Doc-drift: every declared COMMAND is mentioned in CLAUDE.md ---
// CLAUDE.md enumerates the command surface (pipeline + adaptive) by name; a
// command absent from it is exactly the drift that hid launch/hotfix.
// Scoped to commands deliberately: CLAUDE.md describes *skills* conceptually
// rather than enumerating all of them, so a per-skill presence check would
// be a false positive (and a noisy check is worse than no check — see the
// systematic-auditing skill). Skill-inventory drift is a checklist item for
// docs/REGRESSION-CHECKLIST.md instead.
const pluginJson = read('plugins/wingman/.claude-plugin/plugin.json');
const claudeMd = read('CLAUDE.md');
if (pluginJson && claudeMd) {
  const plugin = JSON.parse(pluginJson);
  for (const p of plugin.commands || []) {
    const name = p.split('/').pop().replace(/\.md$/, '');
    // Word-boundary match, not a bare substring: a substring test reports a
    // command as "documented" whenever its name happens to sit inside some
    // unrelated word, which would mask real drift (a false negative on the one
    // thing this check exists to catch).
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mentioned = new RegExp(`\\b${escaped}\\b`).test(claudeMd);
    if (!mentioned) {
      warnings.push(`doc-drift: command "${name}" is declared in plugin.json but not mentioned in CLAUDE.md — confirm CLAUDE.md's command inventory hasn't drifted from what's built (this is how launch/hotfix went undocumented)`);
    }
  }
}

// --- Attribution coverage: every vendored repo appears in ATTRIBUTIONS.md ---
// A vendored repo absent from ATTRIBUTIONS.md is a real compliance gap, not a
// style nit. Matching is normalized: vendor DIR names use dashes
// (addyosmani-agent-skills) while ATTRIBUTIONS uses owner/repo slashes
// (addyosmani/agent-skills), so compare with slashes flattened to dashes and
// case ignored. (Whether each stated *license* is accurate is deliberately a
// docs/REGRESSION-CHECKLIST.md item for the systematic-auditing skill, not a
// mechanical check: the one time it mattered, the accurate correction text
// itself contained the words "no license" while explaining the old error, so
// any keyword heuristic false-positives on its own fix — worse than nothing.)
const attributions = read('ATTRIBUTIONS.md');
const vendorDir = join(repoRoot, 'vendor');
let vendorEntries = [];
try { vendorEntries = readdirSync(vendorDir); } catch { /* no vendor/ checked out */ }

if (attributions && vendorEntries.length) {
  const haystack = attributions.toLowerCase().replace(/\//g, '-');
  for (const entry of vendorEntries) {
    let isDir = false;
    try { isDir = statSync(join(vendorDir, entry)).isDirectory(); } catch { continue; }
    if (!isDir) continue;
    if (!haystack.includes(entry.toLowerCase())) {
      errors.push(`attribution: vendored repo "vendor/${entry}" is not mentioned in ATTRIBUTIONS.md — every vendored repo must be attributed`);
    }
  }
}

// --- Submodule attribution: every vendor path DECLARED in .gitmodules is attributed ---
// The check above reads the vendor/ filesystem, which is only populated when
// submodules are actually checked out — in a CI job that doesn't init them, it
// silently passes over an unattributed submodule. .gitmodules is the committed,
// always-present manifest, so this catches the real drift (a submodule added to
// .gitmodules but never added to ATTRIBUTIONS.md) even without a checkout. Same
// normalization as above (slashes→dashes, case-insensitive). Deliberately
// one-directional: ATTRIBUTIONS.md intentionally also lists NON-vendored,
// browsed-only references (its "Non-vendored attribution" section), so the
// reverse check (every attributed repo must be a submodule) would false-positive
// on entries that are correct by design.
const gitmodules = read('.gitmodules');
if (attributions && gitmodules) {
  const haystack = attributions.toLowerCase().replace(/\//g, '-');
  const declaredPaths = [...gitmodules.matchAll(/^\s*path\s*=\s*vendor\/(\S+)\s*$/gm)].map((m) => m[1]);
  for (const name of declaredPaths) {
    if (!haystack.includes(name.toLowerCase())) {
      errors.push(`attribution: submodule "vendor/${name}" is declared in .gitmodules but not mentioned in ATTRIBUTIONS.md — every pinned submodule must be attributed`);
    }
  }
}

// --- Structural log markers: every entry in LEARNINGS.md/retros.md/PROJECT.md's decisions
// log/HUMAN-TODOS.md carries a preceding `wingman:log` marker ---
// Mirrors how check-traceability.mjs enforces its own req-marker convention: an unenforced
// backfill just rots the first time someone appends a new entry without a marker, so this check
// exists specifically to keep the AI-native structured-log layer from quietly decaying back into
// pure prose.
const { coverage } = parseAll();
if (coverage.markedHeadings < coverage.totalHeadings) {
  warnings.push(`structural-log-drift: ${coverage.totalHeadings - coverage.markedHeadings} entr${coverage.totalHeadings - coverage.markedHeadings === 1 ? 'y' : 'ies'} in LEARNINGS.md/retros.md/PROJECT.md-decisions/HUMAN-TODOS.md is missing a wingman:log marker (see scripts/parse-wingman-logs.mjs) — a new entry was likely appended without one`);
}

// --- Shipped/dev-only script boundary: nothing under plugins/wingman/ may
// reference a path outside plugins/wingman/ ---
// Only plugins/wingman/ ships (install-smoke.yml proves it). A shipped .mjs
// that relative-imports or reads a file from root scripts/, docs/, evals/,
// or tests/ would pass here (both trees exist in this dev checkout) but
// break silently the moment a founder installs just the plugin — the exact
// naming-collision risk this project's own audit history (docs/wingman/
// audit-reorg-2026-07-20.md, action item #8) flagged and left as a TODO.
function walkMjs(dir) {
  let out = [];
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(walkMjs(full));
    else if (entry.isFile() && entry.name.endsWith('.mjs')) out.push(full);
  }
  return out;
}

const pluginRoot = join(repoRoot, 'plugins', 'wingman');
const shippedMjsFiles = walkMjs(pluginRoot);
const relativeRefPattern = /(?:from\s+|import\(|require\(|readFileSync\(|readdirSync\(|existsSync\(|writeFileSync\()\s*['"](\.\.?\/[^'"]*)['"]/g;

for (const file of shippedMjsFiles) {
  const text = readFileSync(file, 'utf-8');
  const fileDir = dirname(file);
  for (const match of text.matchAll(relativeRefPattern)) {
    const specifier = match[1];
    const resolved = resolve(fileDir, specifier);
    const rel = relative(pluginRoot, resolved);
    if (rel.startsWith('..')) {
      errors.push(`shipped-boundary: ${relative(repoRoot, file)} references "${specifier}" which resolves outside plugins/wingman/ — the shipped surface must never depend on a dev-only path, since only plugins/wingman/ ships to a founder's install`);
    }
  }
}

// --- Eval manifest drift: evals/MANIFEST.tsv must match what a fresh
// regeneration produces from evals/cases/*.md right now ---
// The manifest is generated, not hand-maintained (scripts/generate-eval-manifest.mjs),
// specifically so it can't quietly drift from the case files it summarizes
// the way the old filename-heuristic coverage check did. If someone edits a
// case's "Tests ..." line or fixture reference without re-running the
// generator, this catches it the same way a stale generated-lockfile check
// would.
const regenerated = renderManifest(buildManifest());
const committedManifest = read('evals/MANIFEST.tsv');
if (committedManifest !== null && committedManifest !== regenerated) {
  errors.push('eval-manifest-drift: evals/MANIFEST.tsv does not match a fresh regeneration — run `node scripts/generate-eval-manifest.mjs --write` and commit the result');
}

console.log(`Repo-consistency: checked ${vendorEntries.length} vendored repos for attribution coverage, command inventory vs CLAUDE.md, structural-log marker coverage (${coverage.markedHeadings}/${coverage.totalHeadings}), shipped/dev-only script boundary (${shippedMjsFiles.length} files), eval-manifest freshness`);

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
