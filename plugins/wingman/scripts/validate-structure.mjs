#!/usr/bin/env node
// Structural validator for the Wingman plugin.
// Checks that everything plugin.json declares actually exists on disk, that
// every command/agent/skill has the frontmatter fields Claude Code requires,
// and that agent/skill names are globally unique (see docs/ARCHITECTURE.md
// and the wshobson-agents/jeffallan-claude-skills vendor research this
// convention was adapted from). No dependencies beyond Node's stdlib, since
// Node ships with Claude Code itself.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const errors = [];
const warnings = [];

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
  'StopFailure',
  'PreToolUse',
  'PostToolUse',
]);

function parseFrontmatter(filePath) {
  const text = readFileSync(filePath, 'utf-8');
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split('\n')) {
    const fieldMatch = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (fieldMatch) fields[fieldMatch[1]] = fieldMatch[2].trim();
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

const pluginJsonPath = join(pluginRoot, '.claude-plugin/plugin.json');
if (!existsSync(pluginJsonPath)) {
  console.error('FATAL: .claude-plugin/plugin.json not found');
  process.exit(1);
}
const plugin = JSON.parse(readFileSync(pluginJsonPath, 'utf-8'));

// Commands: require `description` in frontmatter.
const seenCommandNames = new Set();
for (const relPath of plugin.commands || []) {
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
  }
}

// Skills: each declared path is a directory; require <dir>/SKILL.md with `name` and `description`.
const seenSkillNames = new Set();
for (const relPath of plugin.skills || []) {
  const skillMdRel = join(relPath, 'SKILL.md');
  const fullPath = checkFile(skillMdRel, 'skill');
  if (!fullPath) continue;
  const fm = parseFrontmatter(fullPath);
  if (!fm || !fm.name) errors.push(`skill ${relPath}: missing required frontmatter field "name"`);
  if (!fm || !fm.description) errors.push(`skill ${relPath}: missing required frontmatter field "description"`);
  if (fm?.description && !/use when|use for|use proactively|triggers/i.test(fm.description)) {
    warnings.push(`skill ${relPath}: description doesn't contain an explicit "Use when..." trigger clause`);
  }
  if (fm?.name) {
    if (seenSkillNames.has(fm.name)) errors.push(`skill name collision: "${fm.name}" (${relPath})`);
    seenSkillNames.add(fm.name);
  }
}

// Hooks: plugin.json's hooks.file must exist, be valid JSON, and every
// top-level key must be a real Claude Code hook event -- see
// VALID_HOOK_EVENTS above for why this specific check exists.
if (plugin.hooks?.file) {
  const fullPath = checkFile(plugin.hooks.file, 'hooks');
  if (fullPath) {
    let hooksConfig;
    try {
      hooksConfig = JSON.parse(readFileSync(fullPath, 'utf-8'));
    } catch (e) {
      errors.push(`hooks file ${plugin.hooks.file}: not valid JSON (${e.message})`);
    }
    if (hooksConfig?.hooks && typeof hooksConfig.hooks === 'object') {
      for (const eventName of Object.keys(hooksConfig.hooks)) {
        if (!VALID_HOOK_EVENTS.has(eventName)) {
          errors.push(
            `hooks file ${plugin.hooks.file}: "${eventName}" is not a real Claude Code hook event ` +
            `(valid events: ${[...VALID_HOOK_EVENTS].join(', ')}) -- this hook will never fire`
          );
        }
      }
    }
  }
}

console.log(`Checked ${(plugin.commands || []).length} commands, ${(plugin.agents || []).length} agents, ${(plugin.skills || []).length} skills, hooks: ${plugin.hooks?.file ?? 'none declared'}`);

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
