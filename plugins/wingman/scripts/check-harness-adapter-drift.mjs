#!/usr/bin/env node
// Drift detector for plugins/wingman/references/harness-adapters/{codex-cli,opencode}/ against
// the canonical plugins/wingman/agents/boardroom-*.md source they were hand-translated from.
//
// Why this exists: those adapters are, by their own README's stated verification status,
// "authored, unverified" -- a faithful one-time translation, not a generated artifact. Nothing
// re-checked them against the canonical source once written, so a later edit to a boardroom-*.md
// (a new seat, a renamed seat, a model-tier change) could silently drift the adapters out of sync
// with no mechanism to notice. This is the single most valuable, concretely reusable practice
// found studying real multi-harness plugin repos (wshobson/agents' `make garden` drift/dead-link
// detector; fusengine/harness's adapter-vs-policy-core separation) -- borrowed here in its most
// proportionate form: a mechanical structural check, not a full markdown-to-TOML/md regeneration
// engine (which would be exactly the kind of fragile, hard-to-verify-at-scale over-engineering
// docs/ARCHITECTURE.md §8b already declined for a full 1:1 command/skill port).
//
// Deliberately checks structure, not prose: every canonical seat has a corresponding file in both
// adapters (coverage), the model tier (opus vs inherit) is consistently reflected in both, and the
// VERDICT block's seat name is present -- not a fuzzy text diff of hand-condensed descriptions,
// which would be too strict (the adapters intentionally shorten prose) and too fragile to maintain
// as a check in its own right.
//
// Usage: node check-harness-adapter-drift.mjs
//   exit 0 = no drift found, exit 1 = drift found (details printed to stderr)

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function readFrontmatterField(text, field) {
  const m = new RegExp(`^${field}:\\s*(.+)$`, 'm').exec(text);
  return m ? m[1].trim() : null;
}

export function listBoardroomSeats(agentsDir) {
  const files = readdirSync(agentsDir).filter((f) => f.startsWith('boardroom-') && f.endsWith('.md'));
  return files.map((f) => f.replace(/^boardroom-/, '').replace(/\.md$/, ''));
}

// Pure: takes the three directory paths explicitly (no hardcoded location), returns an array of
// error strings (empty = clean). The CLI entry point below is a thin wrapper around this.
export function checkDrift(agentsDir, codexDir, opencodeDir) {
  const seats = listBoardroomSeats(agentsDir);
  const errors = [];

  for (const seat of seats) {
    const canonicalPath = join(agentsDir, `boardroom-${seat}.md`);
    const canonical = readFileSync(canonicalPath, 'utf-8');
    const canonicalModel = readFrontmatterField(canonical, 'model');
    const isOpus = canonicalModel === 'opus';
    const verdictHeading = `## ${seat.toUpperCase()} VERDICT:`;

    // --- Codex CLI adapter ---
    const codexPath = join(codexDir, `boardroom-${seat}.toml`);
    if (!existsSync(codexPath)) {
      errors.push(`codex-cli: missing boardroom-${seat}.toml (canonical seat has no Codex adapter -- add one or remove the seat)`);
    } else {
      const codexText = readFileSync(codexPath, 'utf-8');
      if (!codexText.includes(verdictHeading)) {
        errors.push(`codex-cli/boardroom-${seat}.toml: does not contain the expected "${verdictHeading}" block -- output-contract drift from the canonical seat`);
      }
      const modelLine = /^model = .*$/m.exec(codexText)?.[0] || '';
      if (isOpus && !/opus/i.test(modelLine)) {
        errors.push(`codex-cli/boardroom-${seat}.toml: canonical seat pins model: opus, but the adapter's model line doesn't mention opus -- ${modelLine || '(no model line found)'}`);
      }
      if (!isOpus && /opus/i.test(modelLine)) {
        errors.push(`codex-cli/boardroom-${seat}.toml: canonical seat uses model: inherit (no opus pin), but the adapter's model line claims opus -- ${modelLine}`);
      }
    }

    // --- OpenCode adapter ---
    const opencodePath = join(opencodeDir, `boardroom-${seat}.md`);
    if (!existsSync(opencodePath)) {
      errors.push(`opencode: missing boardroom-${seat}.md (canonical seat has no OpenCode adapter -- add one or remove the seat)`);
    } else {
      const opencodeText = readFileSync(opencodePath, 'utf-8');
      if (!opencodeText.includes(verdictHeading)) {
        errors.push(`opencode/boardroom-${seat}.md: does not contain the expected "${verdictHeading}" block -- output-contract drift from the canonical seat`);
      }
      const opencodeModel = readFrontmatterField(opencodeText, 'model') || '';
      if (isOpus && !/opus/i.test(opencodeModel)) {
        errors.push(`opencode/boardroom-${seat}.md: canonical seat pins model: opus, but the adapter's model is "${opencodeModel}" (no opus tier)`);
      }
      if (!isOpus && /opus/i.test(opencodeModel)) {
        errors.push(`opencode/boardroom-${seat}.md: canonical seat uses model: inherit (no opus pin), but the adapter's model is "${opencodeModel}" (opus tier)`);
      }
    }
  }

  // Reverse coverage: an adapter file with no canonical seat behind it (a seat that was removed
  // from plugins/wingman/agents/ but whose adapter was never cleaned up).
  for (const [dir, label] of [[codexDir, 'codex-cli'], [opencodeDir, 'opencode']]) {
    if (!existsSync(dir)) continue;
    const ext = label === 'codex-cli' ? '.toml' : '.md';
    const files = readdirSync(dir).filter((f) => f.startsWith('boardroom-') && f.endsWith(ext));
    for (const f of files) {
      const seat = f.replace(/^boardroom-/, '').replace(new RegExp(`\\${ext}$`), '');
      if (!seats.includes(seat)) {
        errors.push(`${label}/${f}: no corresponding canonical plugins/wingman/agents/boardroom-${seat}.md -- stale adapter for a removed/renamed seat`);
      }
    }
  }

  return errors;
}

// Checks OpenCode's ported skills (.opencode/skills/<name>/SKILL.md, copied verbatim -- see the
// opencode adapter README's "All 40 skills ported with zero translation" section) stay byte-identical
// to the canonical plugins/wingman/skills/<name>/SKILL.md they were copied from. Unlike the Boardroom
// seat check above (a faithful hand-translation, so only structural checks make sense), these are
// meant to be exact copies -- a strict content-equality check is the correct, proportionate bar here,
// not over-strict.
export function checkSkillDrift(skillsDir, opencodeSkillsDir) {
  const errors = [];
  if (!existsSync(opencodeSkillsDir)) return errors; // adapter has no ported skills yet -- nothing to check

  const canonicalSkills = readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  for (const skill of canonicalSkills) {
    const canonicalPath = join(skillsDir, skill, 'SKILL.md');
    const opencodePath = join(opencodeSkillsDir, skill, 'SKILL.md');
    if (!existsSync(canonicalPath)) continue; // not every skill dir necessarily has a SKILL.md at this exact path
    if (!existsSync(opencodePath)) {
      errors.push(`opencode/skills: missing ${skill}/SKILL.md (canonical skill has no ported copy)`);
      continue;
    }
    const canonicalText = readFileSync(canonicalPath, 'utf-8');
    const opencodeText = readFileSync(opencodePath, 'utf-8');
    if (canonicalText !== opencodeText) {
      errors.push(`opencode/skills/${skill}/SKILL.md: content differs from the canonical plugins/wingman/skills/${skill}/SKILL.md -- re-copy it (these are meant to be verbatim, not translated)`);
    }
  }

  // Reverse: a ported skill dir with no canonical skill behind it (removed/renamed upstream, never cleaned up).
  if (existsSync(opencodeSkillsDir)) {
    const portedSkills = readdirSync(opencodeSkillsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    for (const skill of portedSkills) {
      if (!canonicalSkills.includes(skill)) {
        errors.push(`opencode/skills/${skill}/: no corresponding canonical plugins/wingman/skills/${skill}/ -- stale ported skill for a removed/renamed skill`);
      }
    }
  }

  return errors;
}

function main() {
  const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
  const agentsDir = join(pluginRoot, 'agents');
  const codexDir = join(pluginRoot, 'references', 'harness-adapters', 'codex-cli', '.codex', 'agents');
  const opencodeDir = join(pluginRoot, 'references', 'harness-adapters', 'opencode', '.opencode', 'agent');
  const skillsDir = join(pluginRoot, 'skills');
  const opencodeSkillsDir = join(pluginRoot, 'references', 'harness-adapters', 'opencode', '.opencode', 'skills');

  const errors = [...checkDrift(agentsDir, codexDir, opencodeDir), ...checkSkillDrift(skillsDir, opencodeSkillsDir)];
  const seatCount = listBoardroomSeats(agentsDir).length;
  const skillCount = readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length;

  if (errors.length > 0) {
    console.error(`Harness-adapter drift check: ${errors.length} issue(s) found\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error(`\nFAIL`);
    process.exit(1);
  }

  console.log(`Harness-adapter drift check: ${seatCount} Boardroom seat(s) checked against codex-cli/ and opencode/ adapters, ${skillCount} skill(s) checked against opencode/skills/ ported copies -- all consistent.\n\nPASS`);
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
