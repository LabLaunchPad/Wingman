#!/usr/bin/env node
// Generates the cross-harness command/skill surface for every harness target descriptor under
// harness-targets/ from Wingman's canonical plugins/wingman/{commands,skills}/** source.
//
// Why a generator, not a one-time hand port: a hand translation was correctly declined before
// (harness-adapters/README.md) as "untestable at scale" and guaranteed to drift. A generator that's
// regenerated and diff-checked in CI (--check, wired into validate.yml) can't silently rot the way a
// one-time port would -- same principle already established for evals/MANIFEST.tsv
// (scripts/generate-eval-manifest.mjs).
//
// Descriptor-driven (2026-07-27 refactor, docs/ARCHITECTURE.md §8f): this script used to hardcode
// exactly 2 harnesses (Codex CLI, OpenCode) via inline HARNESS_NOTES/HARNESS_LABELS tables and two
// branches in buildTargets(). Adding a 3rd-6th harness (Gemini CLI, Cursor, Cline, OpenHands) the
// same way would mean repeating that hardcoding 4 more times. Instead, every harness's output paths,
// per-primitive "Harness note" prose, and capability profile now live in one descriptor file under
// harness-targets/<id>.mjs, loaded generically by harness-targets/index.mjs -- this file only knows
// how to walk that list, not any specific harness's name.
//
// Real, direct verification (2026-07-25, unchanged by this refactor) locked the target paths:
//   - Skills: a single shared `.agents/skills/<name>/SKILL.md` is read natively by BOTH OpenCode
//     (confirmed via `opencode debug skill`, real install v1.18.4) and Codex CLI (confirmed via
//     `codex debug prompt-input`, real install v0.145.0) -- same file serves both harnesses,
//     zero per-harness translation needed for the frontmatter/body shape itself.
//   - Commands: OpenCode reads `.opencode/commands/<name>.md` natively (confirmed via
//     `opencode debug config`, byte-identical template content). Codex CLI has NO user-authored
//     slash-command/prompt-template file primitive -- so Codex CLI commands fold into one
//     AGENTS.md-appendable reference file instead of being forced into a file shape that doesn't
//     exist for that harness. Each new descriptor's `commands.mode` ('perFile' | 'folded') encodes
//     which shape that harness actually supports.
//   - Boardroom seat agents already have their own hand-built, drift-checked adapters
//     (check-harness-adapter-drift.mjs) -- untouched by this generator.
//
// Primitive substitution: a command/skill that references a Claude-Code-specific primitive
// (AskUserQuestion, ExitPlanMode, parallel Task/Agent dispatch) gets the canonical body copied
// verbatim PLUS an appended, clearly-marked "Harness note" section per harness explaining that
// harness's real equivalent -- additive, never a rewrite of the original prose (rewriting nuanced
// instructions via regex would risk silently corrupting them; appending a note is honest and
// mechanical).
//
// Usage: node generate-harness-adapters.mjs [--write|--check]
//   (no args) -- prints a summary to stdout
//   --write   -- regenerates all output files
//   --check   -- fails (exit 1) if committed output doesn't match a fresh regeneration

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadHarnessTargets } from './harness-targets/index.mjs';

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const skillsDir = join(pluginRoot, 'skills');
const commandsDir = join(pluginRoot, 'commands');
const adaptersRoot = join(pluginRoot, 'references', 'harness-adapters');

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

function harnessNoteBlock(primitiveIds, target) {
  if (primitiveIds.length === 0) return '';
  const lines = primitiveIds.map((id) => `- **${id}**: ${target.notes[id]}`);
  return `\n\n---\n\n## Harness note: ${target.label} (auto-generated by \`generate-harness-adapters.mjs\` -- do not hand-edit)\n\nThis file is a generated copy of the canonical Claude Code source. It references the following Claude-Code-specific mechanism(s); here is the real ${target.label} equivalent:\n\n${lines.join('\n')}\n`;
}

function listSkills() {
  // Flat skills/<name>/SKILL.md layout (no category subdirectory) -- matches how listCommands()
  // already scans dynamically rather than assuming fixed depth.
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
async function buildTargets() {
  const targets = new Map();
  const harnessTargets = await loadHarnessTargets();

  // Shared skills output: every harness that declares `skills.sharedOutDir` reads the same file, so
  // write it once per distinct sharedOutDir, with each contributing harness's note appended in a
  // fixed, explicit order (not directory-scan order, which would silently reorder existing output
  // and fail --check for no real reason) -- OpenCode's note precedes Codex CLI's, matching the order
  // the pre-refactor hardcoded script always produced.
  const skillNoteOrder = ['opencode', 'codex-cli'];
  const sharedOutDirs = new Set(harnessTargets.filter((t) => t.skills?.sharedOutDir).map((t) => t.skills.sharedOutDir));
  const orderedSkillTargets = (dir) =>
    harnessTargets
      .filter((t) => t.skills?.sharedOutDir === dir)
      .sort((a, b) => {
        const ai = skillNoteOrder.indexOf(a.id);
        const bi = skillNoteOrder.indexOf(b.id);
        return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
      });

  for (const sharedOutDir of sharedOutDirs) {
    const contributingTargets = orderedSkillTargets(sharedOutDir);
    for (const { name, path } of listSkills()) {
      const body = readFileSync(path, 'utf-8');
      const primitives = detectPrimitives(body);
      const notesBlock = contributingTargets.map((t) => harnessNoteBlock(primitives, t)).join('');
      const content = body + notesBlock;
      targets.set(join(...sharedOutDir.split('/'), name, 'SKILL.md'), content);
    }
  }

  const commandEntries = listCommands();

  for (const target of harnessTargets) {
    if (!target.commands) continue;

    if (target.commands.mode === 'perFile') {
      for (const { name, path } of commandEntries) {
        const body = readFileSync(path, 'utf-8');
        const primitives = detectPrimitives(body);
        const content = body + harnessNoteBlock(primitives, target);
        targets.set(join(...target.commands.outDir.split('/'), `${name}.md`), content);
      }
    } else if (target.commands.mode === 'toml') {
      // This harness reads one TOML file per command (Gemini CLI: `commands/<name>.toml`, no `name`
      // field -- the command's invocation name derives from its path, per real, confirmed schema).
      // `prompt` carries the full canonical body (frontmatter stripped, $ARGUMENTS -> {{args}} per
      // Gemini's real placeholder syntax) as a TOML literal multi-line string (`'''...'''`) so no
      // escaping of quotes/backslashes in the body is needed; `description` comes from the
      // canonical file's own frontmatter `description:` field, as a basic TOML string.
      for (const { name, path } of commandEntries) {
        const raw = readFileSync(path, 'utf-8');
        const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        const frontmatter = fmMatch ? fmMatch[1] : '';
        const body = (fmMatch ? fmMatch[2] : raw).replace(/\$ARGUMENTS/g, '{{args}}');
        const primitives = detectPrimitives(raw);
        const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
        const description = (descMatch ? descMatch[1].trim() : name).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const note = harnessNoteBlock(primitives, target);
        const promptBody = (body + note).replace(/'''/g, "'' '"); // guard against breaking the literal-string delimiter
        const toml =
          `description = "${description}"\n` +
          `prompt = '''\n${promptBody}\n'''\n`;
        targets.set(join(...target.commands.outDir.split('/'), `${name}.toml`), toml);
      }
    } else if (target.commands.mode === 'folded') {
      // This harness has no per-file command primitive -- fold all commands into one
      // appendable reference file, each as its own section.
      const sections = commandEntries.map(({ name, path }) => {
        const body = readFileSync(path, 'utf-8');
        const primitives = detectPrimitives(body);
        const note = harnessNoteBlock(primitives, target);
        return `## \`/wingman:${name}\`\n\n${body}${note}`;
      });
      const outFileLabel = target.commands.outFileLabel || target.label;
      const header =
        `# Wingman commands, as ${outFileLabel}-appendable workflows\n\n` +
        `${target.commands.headerRationale}\n\n` +
        `Generated by \`generate-harness-adapters.mjs\` from the canonical \`plugins/wingman/commands/**\` ` +
        `source -- do not hand-edit; re-run the generator instead.\n\n---\n\n`;
      targets.set(target.commands.outFile, header + sections.join('\n\n---\n\n'));
    }
  }

  return targets;
}

// Emits the canonical capability-profile table straight from the same descriptors every other
// output here reads, so it can never drift from what actually drives the generated adapters (§8f).
// Written as a standalone file outside adaptersRoot (like evals/MANIFEST.tsv is standalone relative
// to evals/cases/) rather than folded into buildTargets()'s adaptersRoot-relative map, since it's a
// single cross-harness summary, not a per-harness generated artifact.
function buildCapabilityProfile(harnessTargets) {
  const flag = (v) => (v === true ? '✅' : v === false ? '❌' : '⚠️ weak');
  // Claude Code is the native target, not a harness-targets/*.mjs descriptor (it needs no adapter),
  // so its row is synthesized here as the full-parity baseline every other row is measured against.
  const claudeCodeRow = '| Claude Code (native) | ✅ | ✅ | ✅ | ✅ |';
  const rows = harnessTargets.map((t) => {
    const c = t.capabilities || {};
    return `| ${t.label} | ${flag(c.hasHooks)} | ${flag(c.hasPlanGate)} | ${flag(c.hasParallelDispatch)} | ${flag(c.hasQuestionTool)} |`;
  });
  return (
    `# Harness capability profile\n\n` +
    `Generated by \`generate-harness-adapters.mjs\` from each harness's own \`harness-targets/<id>.mjs\` ` +
    `\`capabilities\` block -- do not hand-edit; re-run the generator instead. See each harness's own ` +
    `\`references/harness-adapters/<id>/\` directory for the disclosed substitute behind every ⚠️/❌ cell. ` +
    `Consumed by capability-aware branching in \`boardroom.md\` and other canonical command/skill files ` +
    `(docs/ARCHITECTURE.md §8f) -- a session running under a non-Claude-Code harness reads this table to ` +
    `decide which real primitive to use vs. which disclosed substitute to fall back to.\n\n` +
    `| Harness | Hooks | Plan-gate | Parallel dispatch | Question tool |\n` +
    `|---|---|---|---|---|\n` +
    claudeCodeRow + '\n' +
    rows.join('\n') +
    `\n`
  );
}

function outputDirsToClean(harnessTargets) {
  const dirs = new Set();
  const sharedOutDirs = new Set(harnessTargets.filter((t) => t.skills?.sharedOutDir).map((t) => t.skills.sharedOutDir));
  for (const d of sharedOutDirs) dirs.add(d);
  for (const t of harnessTargets) {
    if (t.commands?.mode === 'perFile' || t.commands?.mode === 'toml') dirs.add(t.commands.outDir);
  }
  return [...dirs];
}

function writeTargets(targets, cleanDirs) {
  // Clean-slate the generated directories first so a removed command/skill's stale output
  // doesn't linger (the same reason evals/MANIFEST.tsv is fully rewritten, not patched).
  for (const dir of cleanDirs) {
    rmSync(join(adaptersRoot, dir), { recursive: true, force: true });
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

function findStale(targets, cleanDirs) {
  const stale = [];
  for (const dir of cleanDirs) {
    const fullDir = join(adaptersRoot, dir);
    if (!existsSync(fullDir)) continue;
    const walk = (d, prefix) => {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const full = join(d, entry.name);
        if (entry.isDirectory()) walk(full, join(prefix, entry.name));
        else {
          const rel = join(dir, prefix, entry.name);
          if (!targets.has(rel)) stale.push(rel);
        }
      }
    };
    walk(fullDir, '');
  }
  return stale;
}

async function main() {
  const mode = process.argv[2];
  const harnessTargets = await loadHarnessTargets();
  const targets = await buildTargets();
  const cleanDirs = outputDirsToClean(harnessTargets);
  const capabilityProfilePath = join(pluginRoot, 'references', 'harness-capability-profile.md');
  const capabilityProfileContent = buildCapabilityProfile(harnessTargets);

  if (mode === '--write') {
    writeTargets(targets, cleanDirs);
    writeFileSync(capabilityProfilePath, capabilityProfileContent);
    console.log(`Wrote ${targets.size} generated file(s) under ${adaptersRoot.replace(pluginRoot, 'plugins/wingman')}, plus references/harness-capability-profile.md.`);
    return;
  }

  if (mode === '--check') {
    const existing = readExisting(targets);
    const mismatches = [];
    for (const [relPath, content] of targets) {
      if (existing.get(relPath) !== content) mismatches.push(relPath);
    }
    const stale = findStale(targets, cleanDirs);
    const capabilityProfileStale =
      (existsSync(capabilityProfilePath) ? readFileSync(capabilityProfilePath, 'utf-8') : null) !== capabilityProfileContent;
    if (mismatches.length || stale.length || capabilityProfileStale) {
      console.error(`Harness-adapter generator drift: ${mismatches.length} stale/missing, ${stale.length} orphaned file(s)${capabilityProfileStale ? ', harness-capability-profile.md stale' : ''}`);
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

export { buildTargets, detectPrimitives, listSkills, listCommands, buildCapabilityProfile };
