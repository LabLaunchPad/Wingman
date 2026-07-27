#!/usr/bin/env node
// Idempotent, opt-in installer for a LOCAL pre-commit hook that runs
// `node scripts/validate-all.mjs --fast` before allowing a commit in THIS dev repo. Never runs
// automatically (no hook triggers it, nothing calls it on its own) -- matches the same "never
// silently modify the repo" discipline as plugins/wingman/scripts/install-git-hooks.mjs, which this
// file otherwise mirrors. Dev-repo-only tooling (root `scripts/`), never ships with the plugin.
//
// Real incident this addresses: a stray `<<<<<<< HEAD` conflict-marker line reached `main` via
// PR #122 because nothing forced a full local check before that commit. `check-repo-consistency.mjs`
// now scans for exactly that (added in the same incident's follow-up), but only when someone
// remembers to run it -- this hook makes that automatic for anyone (human or AI agent) who commits
// in a checkout with this hook installed.
//
// Deliberately pre-commit, not pre-push: catches a bad commit before it's even made, not just
// before it leaves the machine -- cheaper to fix a commit that was never pushed anywhere.
// Deliberately `--fast` (skips check-fixtures.mjs, the slowest check -- it spins up 67 real git
// projects): a pre-commit hook that takes too long gets bypassed with `--no-verify` out of habit,
// which defeats the whole point. Run the full `node scripts/validate-all.mjs` (no `--fast`) before
// actually pushing, same as this project's own standing discipline.
//
// Usage: node scripts/install-dev-git-hooks.mjs [repo-dir]
//   Installs (or reports already-installed) a .git/hooks/pre-commit wrapper. Defaults to this
//   script's own repo if no directory is given. Safe to re-run.
//
// Usage: node scripts/install-dev-git-hooks.mjs [repo-dir] --uninstall
//   Removes the hook only if it's the exact wrapper this script installed.

import { existsSync, readFileSync, writeFileSync, chmodSync, mkdirSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MARKER = '# wingman-dev-pre-commit-hook';

function scriptPath() {
  return resolve(dirname(fileURLToPath(import.meta.url)), 'validate-all.mjs');
}

// POSIX single-quote escaping, same technique install-git-hooks.mjs uses: wrap in '...', replacing
// each embedded ' with '\''. Single quotes in /bin/sh don't expand $, `, \, or " -- so a repoDir
// containing any of those can't break out of the generated hook script's quoting.
function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function buildWrapper() {
  return `#!/bin/sh\n${MARKER} -- installed by scripts/install-dev-git-hooks.mjs\n` +
    `node ${shellQuote(scriptPath())} --fast\n`;
}

function readExistingHook(hookPath) {
  try {
    return readFileSync(hookPath, 'utf-8');
  } catch (err) {
    console.error(
      `Wingman: couldn't read the existing ${hookPath} to check whether this script installed it ` +
      `(${err.code || err.message}). Leaving it alone -- resolve that manually before retrying.`
    );
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  const repoDir = args.find((a) => !a.startsWith('--')) || dirname(dirname(fileURLToPath(import.meta.url)));
  const uninstall = args.includes('--uninstall');

  const gitDir = join(resolve(repoDir), '.git');
  if (!existsSync(gitDir)) {
    console.error(`Wingman: ${repoDir} doesn't look like a git repo (no .git directory found).`);
    process.exit(1);
  }

  const hooksDir = join(gitDir, 'hooks');
  const hookPath = join(hooksDir, 'pre-commit');

  if (uninstall) {
    if (!existsSync(hookPath)) {
      console.log('Wingman: no pre-commit hook installed, nothing to do.');
      return;
    }
    const existing = readExistingHook(hookPath);
    if (!existing.includes(MARKER)) {
      console.error(
        'Wingman: .git/hooks/pre-commit exists but was not installed by this script -- leaving it ' +
        'alone. Remove it manually if you want it gone.'
      );
      process.exit(1);
    }
    unlinkSync(hookPath);
    console.log('Wingman: removed the pre-commit hook.');
    return;
  }

  mkdirSync(hooksDir, { recursive: true });

  if (existsSync(hookPath)) {
    const existing = readExistingHook(hookPath);
    if (existing.includes(MARKER)) {
      console.log('Wingman: pre-commit hook already installed, nothing to do.');
      return;
    }
    console.error(
      'Wingman: .git/hooks/pre-commit already exists and was not installed by this script. Not ' +
      'overwriting it -- merge `node scripts/validate-all.mjs --fast` into your existing hook by ' +
      'hand, or move the existing hook aside first if you want this installer to manage it.'
    );
    process.exit(1);
  }

  writeFileSync(hookPath, buildWrapper());
  chmodSync(hookPath, 0o755);
  console.log(`Wingman: installed .git/hooks/pre-commit -- \`git commit\` in this repo now runs ` +
    `\`validate-all.mjs --fast\` first. Uninstall any time with --uninstall. Still run the full ` +
    `\`node scripts/validate-all.mjs\` (no --fast) before pushing.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
