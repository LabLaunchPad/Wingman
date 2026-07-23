#!/usr/bin/env node
// Generates the cross-harness command/skill surface for Codex CLI and OpenCode from Wingman's
// canonical plugins/wingman/{commands,skills}/** source, so all 24 commands / 40 skills are
// available under those harnesses too, not just the 8 Boardroom seats + git-push gate that
// existed before this generator.
//
// Why a generator, not a one-time hand port: a hand translation of 64 files was correctly
// declined before (harness-adapters/README.md) as "untestable at scale" and guaranteed to drift.
// A generator that's regenerated and diff-checked in CI (--check, wired into validate.yml) can't
// silently rot the way a one-time port would -- same principle already established this session
// for evals/MANIFEST.tsv (scripts/generate-eval-manifest.mjs).
//
// Real, direct verification this session (not docs prose) locked the target paths:
//   - Skills: a single shared `.agents/skills/<name>/SKILL.md` is read natively by BOTH OpenCode
//     (confirmed via `opencode debug skill`, real install v1.18.4) and Codex CLI (confirmed via
//     `codex debug prompt-input`, real install v0.145.0) -- same file serves both harnesses,
//     zero per-harness translation needed for the frontmatter/body shape itself.
//   - Commands: OpenCode reads `.opencode/commands/<name>.md` natively (confirmed via
//     `opencode debug config`, byte-identical template content). Codex CLI has NO user-authored
//     slash-command/prompt-template file primitive (confirmed by direct CLI inspection: no
//     `codex commands` subcommand; `prompts/list`/`prompts/get` are MCP protocol methods, not a
//     local file convention) -- so Codex CLI commands fold into one AGENTS.md-appendable reference
//     file instead of being forced into a file shape that doesn't exist for that harness.
//   - Boardroom seat agents already have their own hand-built, drift-checked adapters
//     (check-harness-adapter-drift.mjs) -- untouched by this generator.
//
// Primitive substitution: a command/skill that references a Claude-Code-specific primitive
// (AskUserQuestion, ExitPlanMode, parallel Task/Agent dispatch) gets the canonical body copied
// verbatim PLUS an appended, clearly-marked "Harness note" section explaining that harness's real
// equivalent -- additive, never a rewrite of the original prose (rewriting nuanced instructions
// via regex would risk silently corrupting them; appending a note is honest and mechanical).
//
// Usage: node generate-harness-adapters.mjs [--write|--check]
//   (no args) -- prints a summary to stdout
//   --write   -- regenerates all output files
//   --check   -- fails (exit 1) if committed output doesn't match a fresh regeneration

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const skillsDir = join(pluginRoot, 'skills');
const commandsDir = join(pluginRoot, 'commands');
const adaptersRoot = join(pluginRoot, 'references', 'harness-adapters');
const sharedSkillsOut = join(adaptersRoot, 'shared', '.agents', 'skills');
const opencodeCommandsOut = join(adaptersRoot, 'opencode', '.opencode', 'commands');
const codexCommandsRefOut = join(adaptersRoot, 'codex-cli', 'commands-as-agents-md.md');

// --- Primitive detection (regex over content, not a hardcoded file list -- so a newly added
// command/skill is classified correctly on the next --write without editing this script) ---
const PRIMITIVES = [
  { id: 'AskUserQuestion', pattern: /AskUserQuestion/ },
  { id: 'ExitPlanMode', pattern: /ExitPlanMode/ },
  // Both word orders matter, and the gap between them can cross a line break (e.g. a heading
  // "...in parallel" followed by a blank line then "Each subagent gets:") -- `.` alone doesn't match
  // `\n` in JS regex without the `s` flag, so `[\s\S]` is used for the gap instead. Found via
  // skills/council/SKILL.md during review, which described parallel dispatch but got no
  // harness note because "in parallel" preceded "subagent" across a line break, not within one line.
  { id: 'ParallelDispatch', pattern: /\bTask tool\b|\bAgent tool\b|\bparallel\b[\s\S]{0,60}\b(subagent|dispatch|agents)\b|\b(subagent|dispatch|agents)\b[\s\S]{0,60}\bparallel\b|\bfan[- ]out\b/i },
];

function detectPrimitives(body) {
  return PRIMITIVES.filter((p) => p.pattern.test(body)).map((p) => p.id);
}

const HARNESS_NOTES = {
  AskUserQuestion: {
    opencode: "OpenCode has no structured multi-choice question UI. Ask the same question as plain conversational text, listing the options in prose, and take the reply as free-form text.",
    codex: "Codex CLI has no structured multi-choice question UI. Ask the same question as plain conversational text, listing the options in prose, and take the reply as free-form text.",
  },
  ExitPlanMode: {
    opencode: "OpenCode's real analog is the `plan_exit` tool (confirmed: opencode.ai/docs). The gating logic this canonical file assumes (`boardroom-checkpoint.mjs`'s ExitPlanMode hook) is ported as a real OpenCode plugin at `references/harness-adapters/opencode/.opencode/plugin/wingman-gate.js` -- wire that plugin in rather than re-deriving the gate.",
    codex: "Codex CLI has no plan-mode concept at all (it uses `approval_policy` for command-level escalation instead, a genuine capability gap, not a missed port). Use `plugins/wingman/scripts/install-git-hooks.mjs` (already harness-agnostic, fires under any `git push` regardless of which agent drove the session) as the real enforcement point instead of a mid-session plan gate.",
  },
  ParallelDispatch: {
    opencode: "OpenCode has a real Task tool and a parallel general-purpose agent (confirmed: opencode.ai/docs/agents). Dispatch each seat/subagent as a Task call the same way this file describes; if a single-message N-way fan-out isn't available, dispatch sequentially and consolidate the same way.",
    codex: "Codex CLI has real parallel multi-agent dispatch (confirmed this session via a live install: `spawn_agent` to create a sub-agent, `followup_task`/`send_message` to direct it, `wait_agent` to collect its result -- up to 4 concurrent agent slots, a lower ceiling than Claude Code's Task-tool fan-out, so batch beyond 4 rather than assuming unlimited concurrency).",
  },
};

const HARNESS_LABELS = { opencode: 'OpenCode', codex: 'Codex CLI' };

function harnessNoteBlock(primitiveIds, harness) {
  if (primitiveIds.length === 0) return '';
  const label = HARNESS_LABELS[harness];
  const lines = primitiveIds.map((id) => `- **${id}**: ${HARNESS_NOTES[id][harness]}`);
  return `\n\n---\n\n## Harness note: ${label} (auto-generated by \`generate-harness-adapters.mjs\` -- do not hand-edit)\n\nThis file is a generated copy of the canonical Claude Code source. It references the following Claude-Code-specific mechanism(s); here is the real ${label} equivalent:\n\n${lines.join('\n')}\n`;
}

function listSkills() {
  // Flat skills/<name>/SKILL.md layout (no category subdirectory) -- matches how listCommands()
  // already scans dynamically rather than assuming fixed depth. Skills used to live nested under
  // skills/<category>/<name>/, but that nesting was removed repo-wide so the on-disk layout matches
  // the flat structure precedent multi-harness repos use and lines up with Codex CLI's plugin-cache
  // path reading this same tree directly.
  const out = [];
  for (const skill of readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const skillPath = join(skillsDir, skill.name, 'SKILL.md');
    if (existsSync(skillPath)) out.push({ name: skill.name, path: skillPath });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function listCommands() {
  // Scans every category subdirectory dynamically, matching listSkills()'s pattern -- a hardcoded
  // ['pipeline', 'adaptive'] list would silently skip a new category directory with no error, and
  // --check would keep passing since there'd be nothing to diff a missing file against.
  const out = [];
  for (const category of readdirSync(commandsDir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const dir = join(commandsDir, category.name);
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md')) {
      out.push({ name: f.replace(/\.md$/, ''), path: join(dir, f) });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// --- Build the in-memory target file map: relative-path -> content ---
function buildTargets() {
  const targets = new Map();

  for (const { name, path } of listSkills()) {
    const body = readFileSync(path, 'utf-8');
    const primitives = detectPrimitives(body);
    // Both harnesses read the identical .agents/skills/<name>/SKILL.md file -- one generated
    // artifact serves both, with per-harness notes appended when needed. Since a single file
    // can't carry two different per-harness note sections cleanly, and the notes are additive
    // documentation (not behavior), include both harnesses' notes together when any primitive
    // is detected -- a reader using either harness sees their own relevant note.
    // This single file is read natively by both harnesses, so both harnesses' notes are appended
    // together when a primitive is detected -- a reader on either harness sees their own note.
    const content = body + harnessNoteBlock(primitives, 'opencode') + harnessNoteBlock(primitives, 'codex');
    targets.set(join('shared', '.agents', 'skills', name, 'SKILL.md'), content);
  }

  const commandEntries = listCommands();
  for (const { name, path } of commandEntries) {
    const body = readFileSync(path, 'utf-8');
    const primitives = detectPrimitives(body);
    const content = body + harnessNoteBlock(primitives, 'opencode');
    targets.set(join('opencode', '.opencode', 'commands', `${name}.md`), content);
  }

  // Codex CLI has no per-file command primitive -- fold all commands into one AGENTS.md-appendable
  // reference file, each as its own section, so a Codex CLI project can paste the relevant
  // sections into its own AGENTS.md (which Codex genuinely discovers and reads).
  const codexSections = commandEntries.map(({ name, path }) => {
    const body = readFileSync(path, 'utf-8');
    const primitives = detectPrimitives(body);
    const note = harnessNoteBlock(primitives, 'codex');
    return `## \`/wingman:${name}\`\n\n${body}${note}`;
  });
  const codexHeader = `# Wingman commands, as AGENTS.md-appendable workflows\n\n` +
    `Codex CLI has no user-authored slash-command/prompt-template file primitive (confirmed by direct\n` +
    `CLI inspection: no \`codex commands\` subcommand; \`prompts/list\`/\`prompts/get\` are MCP protocol\n` +
    `methods for an MCP *server* to expose, not a local file convention a plugin author can drop files\n` +
    `into) -- a genuine capability gap in this harness, not a missed port. Codex CLI does genuinely\n` +
    `discover and read a project's \`AGENTS.md\` for workflow instructions, so each Wingman command below\n` +
    `is written as a section you can paste into your own project's \`AGENTS.md\` (or reference from it)\n` +
    `to get the same workflow under Codex CLI.\n\n` +
    `Generated by \`generate-harness-adapters.mjs\` from the canonical \`plugins/wingman/commands/**\` ` +
    `source -- do not hand-edit; re-run the generator instead.\n\n---\n\n`;
  targets.set('codex-cli/commands-as-agents-md.md', codexHeader + codexSections.join('\n\n---\n\n'));

  return targets;
}

function writeTargets(targets) {
  // Clean-slate the generated directories first so a removed command/skill's stale output
  // doesn't linger (the same reason evals/MANIFEST.tsv is fully rewritten, not patched).
  for (const dir of [sharedSkillsOut, opencodeCommandsOut]) {
    rmSync(dir, { recursive: true, force: true });
  }
  for (const [relPath, content] of targets) {
    const fullPath = join(adaptersRoot, relPath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content);
  }
}

function readExisting(targets) {
  const existing = new Map();
  for (const relPath of targets.keys()) {
    const fullPath = join(adaptersRoot, relPath);
    existing.set(relPath, existsSync(fullPath) ? readFileSync(fullPath, 'utf-8') : null);
  }
  return existing;
}

function main() {
  const mode = process.argv[2];
  const targets = buildTargets();

  if (mode === '--write') {
    writeTargets(targets);
    console.log(`Wrote ${targets.size} generated file(s) under ${adaptersRoot.replace(pluginRoot, 'plugins/wingman')}.`);
    return;
  }

  if (mode === '--check') {
    const existing = readExisting(targets);
    const mismatches = [];
    for (const [relPath, content] of targets) {
      if (existing.get(relPath) !== content) mismatches.push(relPath);
    }
    // Also check for stale files present on disk but no longer in the generated set.
    const staleDirs = [sharedSkillsOut, opencodeCommandsOut];
    const stale = [];
    for (const dir of staleDirs) {
      if (!existsSync(dir)) continue;
      const walk = (d, prefix) => {
        for (const entry of readdirSync(d, { withFileTypes: true })) {
          const full = join(d, entry.name);
          if (entry.isDirectory()) walk(full, join(prefix, entry.name));
          else {
            const rel = join(dir === sharedSkillsOut ? join('shared', '.agents', 'skills') : join('opencode', '.opencode', 'commands'), prefix, entry.name);
            if (!targets.has(rel)) stale.push(rel);
          }
        }
      };
      walk(dir, '');
    }
    if (mismatches.length || stale.length) {
      console.error(`Harness-adapter generator drift: ${mismatches.length} stale/missing, ${stale.length} orphaned file(s)`);
      for (const m of mismatches) console.error(`  - stale/missing: ${m}`);
      for (const s of stale) console.error(`  - orphaned (no longer generated): ${s}`);
      console.error('\nRun: node plugins/wingman/scripts/generate-harness-adapters.mjs --write\n\nFAIL');
      process.exit(1);
    }
    console.log(`Harness-adapter generator: ${targets.size} generated file(s) all current.\n\nPASS`);
    return;
  }

  console.log(`Would generate ${targets.size} file(s). Run with --write to apply, --check to verify.`);
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) main();

export { buildTargets, detectPrimitives, listSkills, listCommands };
