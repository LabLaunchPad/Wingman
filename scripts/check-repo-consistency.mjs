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
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

console.log(`Repo-consistency: checked ${vendorEntries.length} vendored repos for attribution coverage, command inventory vs CLAUDE.md`);

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
