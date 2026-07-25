#!/usr/bin/env node
// Real installer for the OpenCode adapter -- replaces the old 3-step manual `cp -r .opencode ...`
// instructions with a single, tested command. Copies this adapter's .opencode/ directory (8
// boardroom-*.md agents, 32 commands, 40 skills, wingman-gate.js) into a target project, and
// optionally installs plugins/wingman/scripts/dod-pre-push-check.mjs as a real git pre-push hook
// via install-git-hooks.mjs -- the one gate confirmed to work regardless of harness (see this
// adapter's README's "The real, high-confidence win: the git-push gate" section).
//
// Also writes a minimal opencode.json if the target project doesn't already have one -- a real,
// live-confirmed requirement, not documented anywhere before this: OpenCode's project-level skill
// discovery (`.opencode/skills/<name>/SKILL.md`) silently found zero skills in a project with no
// opencode.json present, and started working the moment a minimal one existed. Never overwrites an
// existing opencode.json (a target project's real config is not this installer's to touch).
//
// Usage: node install.mjs <target-project-dir>
//   Copies .opencode/ into <target-project-dir>. Safe to re-run (overwrites with the current
//   adapter content, never deletes files the target project itself created outside .opencode/).
//
// Usage: node install.mjs <target-project-dir> --with-git-hook
//   Also installs the git pre-push DoD gate via install-git-hooks.mjs.

import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const SELF_DIR = dirname(fileURLToPath(import.meta.url));
const SOURCE_OPENCODE_DIR = join(SELF_DIR, '.opencode');

function copyDirRecursive(srcDir, destDir) {
  mkdirSync(destDir, { recursive: true });
  let fileCount = 0;
  for (const entry of readdirSync(srcDir)) {
    const srcPath = join(srcDir, entry);
    const destPath = join(destDir, entry);
    if (statSync(srcPath).isDirectory()) {
      fileCount += copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
      fileCount += 1;
    }
  }
  return fileCount;
}

function main() {
  const args = process.argv.slice(2);
  const targetDir = args[0];
  const withGitHook = args.includes('--with-git-hook');

  if (!targetDir) {
    console.error('Usage: node install.mjs <target-project-dir> [--with-git-hook]');
    process.exit(1);
  }
  if (!existsSync(SOURCE_OPENCODE_DIR)) {
    console.error(`Adapter source not found at ${SOURCE_OPENCODE_DIR} -- is this script still next to its own .opencode/ directory?`);
    process.exit(1);
  }

  const resolvedTarget = resolve(targetDir);
  if (!existsSync(resolvedTarget)) {
    console.error(`Target project directory does not exist: ${resolvedTarget}`);
    process.exit(1);
  }

  const destOpencodeDir = join(resolvedTarget, '.opencode');
  const fileCount = copyDirRecursive(SOURCE_OPENCODE_DIR, destOpencodeDir);
  console.log(`Copied ${fileCount} file(s) into ${destOpencodeDir}`);

  const opencodeJsonPath = join(resolvedTarget, 'opencode.json');
  if (!existsSync(opencodeJsonPath)) {
    writeFileSync(opencodeJsonPath, JSON.stringify({ $schema: 'https://opencode.ai/config.json' }, null, 2) + '\n');
    console.log(`Wrote a minimal ${opencodeJsonPath} (required for OpenCode's project-level skill discovery -- confirmed live, not just documented).`);
  } else {
    console.log(`\n${opencodeJsonPath} already exists -- left untouched.`);
  }

  console.log('\nNext steps (not automated -- each is project-specific):');
  console.log('  1. Edit each .opencode/agent/boardroom-*.md\'s `model:` field to a model your');
  console.log('     OpenCode install actually has configured -- the shipped values are placeholders,');
  console.log('     not confirmed defaults.');
  console.log('  2. Confirm the plugin loads: run `opencode debug config` inside the target project');
  console.log('     and check its `plugin` array lists .opencode/plugin/wingman-gate.js.');
  console.log('  3. Read this adapter\'s README\'s "wingman-gate.js: confirmed likely broken" section');
  console.log('     before relying on the plan-exit gate -- its wiring is currently known-unreliable,');
  console.log('     not just unverified. The decision logic (evaluateCheckpoint) is correct and tested.');

  if (withGitHook) {
    const installGitHooksScript = join(SELF_DIR, '..', '..', '..', 'scripts', 'install-git-hooks.mjs');
    if (!existsSync(installGitHooksScript)) {
      console.error(`\n--with-git-hook requested but install-git-hooks.mjs not found at ${installGitHooksScript}`);
      process.exit(1);
    }
    console.log('\nInstalling the git pre-push DoD gate (harness-agnostic, works regardless of OpenCode):');
    execFileSync('node', [installGitHooksScript, resolvedTarget], { stdio: 'inherit' });
  } else {
    console.log('\n(Skipped the git pre-push DoD gate -- pass --with-git-hook to also install it.)');
  }
}

main();
