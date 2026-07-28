#!/usr/bin/env node
// Drift detector for every harness target descriptor's agent-persona adapter against the canonical
// plugins/wingman/agents/boardroom-*.md source they were hand-translated from, plus OpenCode's
// separately-ported verbatim skills copy.
//
// Why this exists: those adapters are, by their own README's stated verification status, mostly
// "authored, unverified" -- a faithful one-time translation, not a generated artifact. Nothing
// re-checked them against the canonical source once written, so a later edit to a boardroom-*.md
// (a new seat, a renamed seat, a model-tier change) could silently drift the adapters out of sync
// with no mechanism to notice. This is the single most valuable, concretely reusable practice
// found studying real multi-harness plugin repos (wshobson/agents' `make garden` drift/dead-link
// detector; fusengine/harness's adapter-vs-policy-core separation) -- borrowed here in its most
// proportionate form: a mechanical structural check, not a full markdown-to-TOML/md regeneration
// engine (which would be exactly the kind of fragile, hard-to-verify-at-scale over-engineering
// docs/status/ARCHITECTURE.md §8b already declined for a full 1:1 command/skill port).
//
// Deliberately checks structure, not prose: every canonical seat has a corresponding file in every
// harness that declares an `agents` output (coverage), the model tier (opus vs inherit) is
// consistently reflected in each, and the VERDICT block's seat name is present -- not a fuzzy text
// diff of hand-condensed descriptions, which would be too strict (the adapters intentionally
// shorten prose) and too fragile to maintain as a check in its own right.
//
// Descriptor-driven (2026-07-27 refactor, docs/status/ARCHITECTURE.md §8f): this used to hardcode exactly
// codexDir/opencodeDir constants and two inline branches. It now iterates whatever
// harness-targets/*.mjs declares an `agents` block, so a new harness with its own persona-adapter
// format is covered by adding a descriptor, not by editing this file's logic.
//
// Usage: node check-harness-adapter-drift.mjs
//   exit 0 = no drift found, exit 1 = drift found (details printed to stderr)

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadHarnessTargets } from './harness-targets/index.mjs';

function readFrontmatterField(text, field) {
  const m = new RegExp(`^${field}:\\s*(.+)$`, 'm').exec(text);
  return m ? m[1].trim() : null;
}

export function listBoardroomSeats(agentsDir) {
  const files = readdirSync(agentsDir).filter((f) => f.startsWith('boardroom-') && f.endsWith('.md'));
  return files.map((f) => f.replace(/^boardroom-/, '').replace(/\.md$/, ''));
}

// Reads a harness adapter's per-seat model signal, generically: `.toml` adapters carry a bare
// `model = "..."` line (matched via the descriptor's own modelFieldPattern); `.md` adapters carry a
// `model: ...` frontmatter field (matched via readFrontmatterField using the descriptor's
// modelFieldName). Exactly one of the two is set per descriptor.
function readAdapterModelSignal(text, target) {
  if (target.agents.modelFieldPattern) {
    return target.agents.modelFieldPattern.exec(text)?.[0] || '';
  }
  return readFrontmatterField(text, target.agents.modelFieldName) || '';
}

// Pure: takes the canonical agents dir and the list of harness-target descriptors that declare an
// `agents` block, returns an array of error strings (empty = clean).
export function checkDrift(agentsDir, harnessAgentTargets) {
  const seats = listBoardroomSeats(agentsDir);
  const errors = [];

  for (const seat of seats) {
    const canonicalPath = join(agentsDir, `boardroom-${seat}.md`);
    const canonical = readFileSync(canonicalPath, 'utf-8');
    const canonicalModel = readFrontmatterField(canonical, 'model');
    const isOpus = canonicalModel === 'opus';
    const verdictHeading = `## ${seat.toUpperCase()} VERDICT:`;

    for (const target of harnessAgentTargets) {
      const adapterPath = join(target.agentsDirAbs, `boardroom-${seat}${target.agents.ext}`);
      if (!existsSync(adapterPath)) {
        errors.push(`${target.id}: missing boardroom-${seat}${target.agents.ext} (canonical seat has no ${target.label} adapter -- add one or remove the seat)`);
        continue;
      }
      const adapterText = readFileSync(adapterPath, 'utf-8');
      if (!adapterText.includes(verdictHeading)) {
        errors.push(`${target.id}/boardroom-${seat}${target.agents.ext}: does not contain the expected "${verdictHeading}" block -- output-contract drift from the canonical seat`);
      }
      const modelSignal = readAdapterModelSignal(adapterText, target);
      if (isOpus && !/opus/i.test(modelSignal)) {
        errors.push(`${target.id}/boardroom-${seat}${target.agents.ext}: canonical seat pins model: opus, but the adapter's model signal doesn't mention opus -- ${modelSignal || '(none found)'}`);
      }
      if (!isOpus && /opus/i.test(modelSignal)) {
        errors.push(`${target.id}/boardroom-${seat}${target.agents.ext}: canonical seat uses model: inherit (no opus pin), but the adapter's model signal claims opus -- ${modelSignal}`);
      }
    }
  }

  // Reverse coverage: an adapter file with no canonical seat behind it (a seat that was removed
  // from plugins/wingman/agents/ but whose adapter was never cleaned up).
  for (const target of harnessAgentTargets) {
    if (!existsSync(target.agentsDirAbs)) continue;
    const files = readdirSync(target.agentsDirAbs).filter((f) => f.startsWith('boardroom-') && f.endsWith(target.agents.ext));
    for (const f of files) {
      const seat = f.replace(/^boardroom-/, '').replace(new RegExp(`\\${target.agents.ext}$`), '');
      if (!seats.includes(seat)) {
        errors.push(`${target.id}/${f}: no corresponding canonical plugins/wingman/agents/boardroom-${seat}.md -- stale adapter for a removed/renamed seat`);
      }
    }
  }

  return errors;
}

// Checks a harness's separately-ported, byte-verbatim skills copy (distinct from the
// shared/.agents/skills/ the generator emits -- see harness-targets/opencode.mjs's comment) stays
// identical to the canonical plugins/wingman/skills/<name>/SKILL.md it was copied from.
export function checkSkillDrift(skillsDir, portedSkillsDirAbs, harnessId) {
  const errors = [];
  if (!existsSync(portedSkillsDirAbs)) return errors; // adapter has no ported skills yet -- nothing to check

  const canonicalSkills = readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  for (const skill of canonicalSkills) {
    const canonicalPath = join(skillsDir, skill, 'SKILL.md');
    const portedPath = join(portedSkillsDirAbs, skill, 'SKILL.md');
    if (!existsSync(canonicalPath)) continue; // not every skill dir necessarily has a SKILL.md at this exact path
    if (!existsSync(portedPath)) {
      errors.push(`${harnessId}/skills: missing ${skill}/SKILL.md (canonical skill has no ported copy)`);
      continue;
    }
    const canonicalText = readFileSync(canonicalPath, 'utf-8');
    const portedText = readFileSync(portedPath, 'utf-8');
    if (canonicalText !== portedText) {
      errors.push(`${harnessId}/skills/${skill}/SKILL.md: content differs from the canonical plugins/wingman/skills/${skill}/SKILL.md -- re-copy it (these are meant to be verbatim, not translated)`);
    }
  }

  // Reverse: a ported skill dir with no canonical skill behind it (removed/renamed upstream, never cleaned up).
  const portedSkills = readdirSync(portedSkillsDirAbs, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  for (const skill of portedSkills) {
    if (!canonicalSkills.includes(skill)) {
      errors.push(`${harnessId}/skills/${skill}/: no corresponding canonical plugins/wingman/skills/${skill}/ -- stale ported skill for a removed/renamed skill`);
    }
  }

  return errors;
}

async function main() {
  const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
  const agentsDir = join(pluginRoot, 'agents');
  const skillsDir = join(pluginRoot, 'skills');
  const adaptersRoot = join(pluginRoot, 'references', 'harness-adapters');

  const harnessTargets = await loadHarnessTargets();
  const harnessAgentTargets = harnessTargets
    .filter((t) => t.agents)
    .map((t) => ({ ...t, agentsDirAbs: join(adaptersRoot, ...t.agents.dir.split('/')) }));

  const errors = [...checkDrift(agentsDir, harnessAgentTargets)];
  for (const target of harnessTargets) {
    if (target.portedSkillsDir) {
      errors.push(...checkSkillDrift(skillsDir, join(adaptersRoot, ...target.portedSkillsDir.split('/')), target.id));
    }
  }

  const seatCount = listBoardroomSeats(agentsDir).length;
  const skillCount = readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length;
  const adapterLabels = harnessAgentTargets.map((t) => `${t.id}/`).join(', ');

  if (errors.length > 0) {
    console.error(`Harness-adapter drift check: ${errors.length} issue(s) found\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error(`\nFAIL`);
    process.exit(1);
  }

  console.log(`Harness-adapter drift check: ${seatCount} Boardroom seat(s) checked against ${adapterLabels} adapters, ${skillCount} skill(s) checked against ported copies -- all consistent.\n\nPASS`);
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
