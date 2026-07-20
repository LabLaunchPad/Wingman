#!/usr/bin/env node
// Structural validator for the Wingman plugin.
// Checks that everything plugin.json declares actually exists on disk, that
// every command/agent/skill has the frontmatter fields Claude Code requires,
// and that agent/skill names are globally unique (see docs/ARCHITECTURE.md
// and the wshobson-agents/jeffallan-claude-skills vendor research this
// convention was adapted from). No dependencies beyond Node's stdlib, since
// Node ships with Claude Code itself.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const errors = [];
const warnings = [];

// Agents whose model tier is load-bearing, per docs/ARCHITECTURE.md §8:
// the two highest-stakes reviewers (a wrong call is expensive) must run on
// opus, not inherit. They silently drifted to `inherit` once and only an
// audit caught it -- mechanizing keeps that from recurring.
// Renamed from boardroom-engineer/boardroom-security to boardroom-cto/
// boardroom-ciso in the 7-seat Boardroom expansion (schema_version 2,
// see docs/DATABASE.md) -- update this set again if the seats are ever
// renamed further, or this invariant silently stops being checked.
const OPUS_REQUIRED_AGENTS = new Set(['boardroom-cto', 'boardroom-ciso']);

// Agent Permission Model (read/write/approve/execute/deploy). `approve` is
// exclusive to Boardroom seats; department leads/managers/specialists must
// never declare it, and nothing declares `deploy` except dept-devops-
// dispatched work. This is a documentation-and-consistency check today, not
// yet a runtime-enforced permission system.
const VALID_PERMISSIONS = new Set(['read', 'write', 'approve', 'execute', 'deploy']);
const BOARDROOM_AGENT_PREFIX = 'boardroom-';

// The only real hook events Claude Code's hooks system supports. A wrong
// event name here fails silently at runtime -- the hook is just never
// invoked, with no error anywhere -- so this is worth checking mechanically
// rather than trusting it gets typed correctly. (Found the hard way: an
// earlier version of hooks.json used "PermissionRequest", which isn't a
// real event, and the plan-mode safety gate was silently inert because of
// it until an unrelated audit caught it by accident.)
const VALID_HOOK_EVENTS = new Set([
  'SessionStart',
  'SessionEnd',
  'UserPromptSubmit',
  'Stop',
  'SubagentStop',
  'PreCompact',
  'Notification',
  'PreToolUse',
  'PostToolUse',
]);

function parseFrontmatter(filePath, textOverride) {
  const text = textOverride ?? readFileSync(filePath, 'utf-8');
  // Tolerate CRLF line endings (some checkouts don't normalize), so the
  // frontmatter check doesn't false-fail on a file saved with Windows line
  // endings rather than on a genuinely missing frontmatter block.
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const fieldMatch = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (fieldMatch) {
      // Strip a single layer of surrounding quotes so `model: "opus"` and
      // `model: opus` parse identically — YAML treats them as the same value,
      // but a naive capture keeps the quotes and would fail an exact-string
      // check (e.g. the opus model-tier invariant) on the quoted form.
      const raw = fieldMatch[2].trim();
      fields[fieldMatch[1]] = raw.replace(/^(["'])(.*)\1$/, '$2');
    }
  }
  return fields;
}

function checkFile(relPath, label) {
  const fullPath = join(pluginRoot, relPath);
  if (!existsSync(fullPath)) {
    errors.push(`${label}: declared in plugin.json but missing on disk: ${relPath}`);
    return null;
  }
  return fullPath;
}

// Claude Code's real plugin.json schema rejects a path string that doesn't
// start with "./" (confirmed directly with `claude plugin validate` against
// this repo -- it fails with a bare "Invalid input" and no further detail).
// Node's path.join() silently tolerates the missing prefix, which is exactly
// how this went unnoticed by checkFile() above until a real install was
// attempted.
function requireDotSlash(relPath, label) {
  if (!relPath.startsWith('./')) {
    errors.push(`${label} "${relPath}": path must start with "./" -- Claude Code's plugin.json schema rejects bare relative paths (confirmed via \`claude plugin validate\`)`);
  }
}

const pluginJsonPath = join(pluginRoot, '.claude-plugin/plugin.json');
if (!existsSync(pluginJsonPath)) {
  console.error('FATAL: .claude-plugin/plugin.json not found');
  process.exit(1);
}
const plugin = JSON.parse(readFileSync(pluginJsonPath, 'utf-8'));

// Commands: require `description` in frontmatter.
const seenCommandNames = new Set();
for (const relPath of plugin.commands || []) {
  requireDotSlash(relPath, 'command');
  const fullPath = checkFile(relPath, 'command');
  if (!fullPath) continue;
  const fm = parseFrontmatter(fullPath);
  if (!fm || !fm.description) {
    errors.push(`command ${relPath}: missing required frontmatter field "description"`);
  }
  const name = relPath.split('/').pop().replace(/\.md$/, '');
  if (seenCommandNames.has(name)) errors.push(`command name collision: "${name}" (${relPath})`);
  seenCommandNames.add(name);
}

// Agents: require `name` and `description`, and names must be globally unique.
const seenAgentNames = new Set();
for (const relPath of plugin.agents || []) {
  requireDotSlash(relPath, 'agent');
  const fullPath = checkFile(relPath, 'agent');
  if (!fullPath) continue;
  const fm = parseFrontmatter(fullPath);
  if (!fm || !fm.name) errors.push(`agent ${relPath}: missing required frontmatter field "name"`);
  if (!fm || !fm.description) errors.push(`agent ${relPath}: missing required frontmatter field "description"`);
  if (fm?.description && !/use when|use for|use proactively/i.test(fm.description)) {
    warnings.push(`agent ${relPath}: description doesn't contain an explicit "Use when..." trigger clause (the "description trap" — see jeffallan-claude-skills research: agents/skills need trigger conditions in the description itself, not just in the body)`);
  }
  if (fm?.name) {
    if (seenAgentNames.has(fm.name)) errors.push(`agent name collision: "${fm.name}" (${relPath})`);
    seenAgentNames.add(fm.name);
    // Model-tier invariant (docs/ARCHITECTURE.md §8).
    if (OPUS_REQUIRED_AGENTS.has(fm.name) && fm.model !== 'opus') {
      errors.push(`agent ${relPath}: "${fm.name}" must be "model: opus" per ARCHITECTURE.md §8 (a wrong call from this seat is expensive), found "model: ${fm.model ?? 'unset'}"`);
    }
    // Agent Permission Model (docs/ARCHITECTURE.md §4a): a documentation-and-
    // consistency check, not yet runtime-enforced. Missing is a warning
    // (soft rollout); present-but-invalid is an error; "approve" is
    // Boardroom-exclusive.
    if (fm.permissions == null) {
      warnings.push(`agent ${relPath}: missing "permissions" field (Agent Permission Model — one of ${[...VALID_PERMISSIONS].join('/')})`);
    } else if (!VALID_PERMISSIONS.has(fm.permissions)) {
      errors.push(`agent ${relPath}: "permissions: ${fm.permissions}" is not one of ${[...VALID_PERMISSIONS].join('/')}`);
    } else if (fm.permissions === 'approve' && !fm.name?.startsWith(BOARDROOM_AGENT_PREFIX)) {
      errors.push(`agent ${relPath}: "permissions: approve" is exclusive to Boardroom seats (name must start with "${BOARDROOM_AGENT_PREFIX}")`);
    } else if (fm.name?.startsWith(BOARDROOM_AGENT_PREFIX) && fm.permissions !== 'approve') {
      errors.push(`agent ${relPath}: Boardroom seat "${fm.name}" must be "permissions: approve", found "${fm.permissions}"`);
    }
  }
}

// Skills: each declared path is a directory; require <dir>/SKILL.md with `name` and `description`.
const seenSkillNames = new Set();
for (const relPath of plugin.skills || []) {
  requireDotSlash(relPath, 'skill');
  const skillMdRel = join(relPath, 'SKILL.md');
  const fullPath = checkFile(skillMdRel, 'skill');
  if (!fullPath) continue;
  // Read once, reuse for both frontmatter parsing and the anatomy scan below
  // (was two separate reads of the same file — see FIXLOG.md PERF2).
  const skillText = readFileSync(fullPath, 'utf-8');
  const fm = parseFrontmatter(fullPath, skillText);
  if (!fm || !fm.name) errors.push(`skill ${relPath}: missing required frontmatter field "name"`);
  if (!fm || !fm.description) errors.push(`skill ${relPath}: missing required frontmatter field "description"`);
  if (fm?.description && !/use when|use for|use proactively|triggers/i.test(fm.description)) {
    warnings.push(`skill ${relPath}: description doesn't contain an explicit "Use when..." trigger clause`);
  }
  // Skill-anatomy: the self-detection triad this project requires of every
  // skill (Rationalizations, Red Flags, Verification) is what makes a skill's
  // own failure modes catchable. Missing sections is a warning, not an error,
  // because a skill may legitimately use equivalent headings (e.g.
  // systematic-debugging's "Iron Law" / "Common Rationalizations") -- but the
  // concepts should all be present. Matched on concept, not exact heading.
  const body = skillText;
  for (const [concept, re] of [
    ['Rationalizations', /rationaliz/i],
    ['Red Flags', /red flag/i],
    ['Verification', /\bverif/i],
  ]) {
    if (!re.test(body)) {
      warnings.push(`skill ${relPath}: no "${concept}" content found — the self-detection triad (Rationalizations/Red Flags/Verification) is what makes a skill's own failure modes catchable; confirm an equivalent exists`);
    }
  }
  if (fm?.name) {
    if (seenSkillNames.has(fm.name)) errors.push(`skill name collision: "${fm.name}" (${relPath})`);
    seenSkillNames.add(fm.name);
  }
}

// Hooks: `hooks/hooks.json` is auto-loaded by Claude Code purely by
// convention -- it must NOT also be declared via plugin.json's `hooks`
// field. Confirmed the hard way: a real `claude plugin install` of this
// exact plugin failed outright with "Duplicate hooks file detected... the
// standard hooks/hooks.json is loaded automatically, so manifest.hooks
// should only reference additional hook files." So this check is inverted
// from a naive reading of the schema: plugin.json declaring `hooks` at all
// (when it just points at the conventional path) is the error, not its
// absence.
if (plugin.hooks) {
  errors.push(`plugin.json declares "hooks": "${plugin.hooks}" -- hooks/hooks.json is auto-loaded by convention; an explicit manifest.hooks entry pointing at it makes the plugin fail to load entirely ("Duplicate hooks file detected")`);
}
const hooksFileRel = 'hooks/hooks.json';
const hooksFullPath = join(pluginRoot, hooksFileRel);
if (existsSync(hooksFullPath)) {
  let hooksConfig;
  try {
    hooksConfig = JSON.parse(readFileSync(hooksFullPath, 'utf-8'));
  } catch (e) {
    errors.push(`hooks file ${hooksFileRel}: not valid JSON (${e.message})`);
  }
  if (hooksConfig?.hooks && typeof hooksConfig.hooks === 'object') {
    for (const eventName of Object.keys(hooksConfig.hooks)) {
      if (!VALID_HOOK_EVENTS.has(eventName)) {
        errors.push(
          `hooks file ${hooksFileRel}: "${eventName}" is not a real Claude Code hook event ` +
          `(valid events: ${[...VALID_HOOK_EVENTS].join(', ')}) -- this hook will never fire`
        );
      }
    }
  }
}

// Orphan detection: a file built on disk but never declared in plugin.json
// is invisible to Claude Code at runtime -- it silently does nothing. The
// "declared but missing" direction is already caught by checkFile above;
// this catches the reverse ("built a command, forgot to register it").
function reportOrphans(dirRel, declaredPaths, kind, isSkillDir = false) {
  const declared = new Set(declaredPaths.map((p) => p.split('/').pop()));
  let entries;
  try {
    entries = readdirSync(join(pluginRoot, dirRel));
  } catch {
    return; // dir doesn't exist -- nothing declared from it either, fine
  }
  for (const entry of entries) {
    const full = join(pluginRoot, dirRel, entry);
    if (isSkillDir) {
      if (statSync(full).isDirectory() && !declared.has(entry)) {
        errors.push(`${kind} "${entry}/" exists on disk but is not declared in plugin.json — it will never load`);
      }
    } else if (entry.endsWith('.md') && !declared.has(entry)) {
      errors.push(`${kind} "${entry}" exists on disk but is not declared in plugin.json — it will never load`);
    }
  }
}
reportOrphans('commands', plugin.commands || [], 'command');
reportOrphans('agents', plugin.agents || [], 'agent');
reportOrphans('skills', plugin.skills || [], 'skill', true);

console.log(`Checked ${(plugin.commands || []).length} commands, ${(plugin.agents || []).length} agents, ${(plugin.skills || []).length} skills, hooks: ${existsSync(hooksFullPath) ? hooksFileRel + ' (auto-loaded)' : 'none found'}`);

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
