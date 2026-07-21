#!/usr/bin/env node
// Idempotent, opt-in installer for dod-pre-push-check.mjs as a real git pre-push hook. Never runs
// automatically (no hook triggers it, no other script calls it) -- matches this project's standing
// "never silently modify the user's repo" discipline. Fires under any coding-agent harness, or a
// human typing `git push` directly, since it's git's own hook mechanism, not an AI-harness-specific
// one -- the concrete, testable half of this session's Codex CLI / OpenCode portability work (see
// plugins/wingman/references/harness-adapters/README.md for the harness-specific, unverified half).
//
// Usage: node plugins/wingman/scripts/install-git-hooks.mjs <repo-dir>
//   Installs (or reports already-installed) a .git/hooks/pre-push wrapper that calls
//   dod-pre-push-check.mjs with the correct absolute paths. Safe to re-run.
//
// Usage: node plugins/wingman/scripts/install-git-hooks.mjs <repo-dir> --uninstall
//   Removes the hook only if it's the exact wrapper this script installed (never touches a
//   pre-existing pre-push hook it didn't write).

import { existsSync, readFileSync, writeFileSync, chmodSync, mkdirSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MARKER = '# wingman-pre-push-hook';

function checkScriptPath() {
  return resolve(dirname(fileURLToPath(import.meta.url)), 'dod-pre-push-check.mjs');
}

// POSIX single-quote escaping: wrap in '...', replacing each embedded ' with '\''. Unlike double
// quotes, single quotes in /bin/sh don't expand $, `, \, or " -- so a repoDir containing any of
// those can't break out of the generated hook script's quoting.
function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function buildWrapper(repoDir) {
  const scriptPath = checkScriptPath();
  return `#!/bin/sh\n${MARKER} -- installed by plugins/wingman/scripts/install-git-hooks.mjs\n` +
    `node ${shellQuote(scriptPath)} ${shellQuote(resolve(repoDir))}\n`;
}

// readFileSync throws on a directory, a permissions error, or a race where the path disappears
// between existsSync and the read -- surface that as the same graceful, plain-language error this
// script uses everywhere else, not a raw Node stack trace.
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
  const repoDir = args.find((a) => !a.startsWith('--'));
  const uninstall = args.includes('--uninstall');

  if (!repoDir) {
    console.error('Usage: node install-git-hooks.mjs <repo-dir> [--uninstall]');
    process.exit(1);
  }

  const gitDir = join(resolve(repoDir), '.git');
  if (!existsSync(gitDir)) {
    console.error(`Wingman: ${repoDir} doesn't look like a git repo (no .git directory found).`);
    process.exit(1);
  }

  const hooksDir = join(gitDir, 'hooks');
  const hookPath = join(hooksDir, 'pre-push');

  if (uninstall) {
    if (!existsSync(hookPath)) {
      console.log('Wingman: no pre-push hook installed, nothing to do.');
      return;
    }
    const existing = readExistingHook(hookPath);
    if (!existing.includes(MARKER)) {
      console.error(
        'Wingman: .git/hooks/pre-push exists but was not installed by this script -- leaving it ' +
        'alone. Remove it manually if you want it gone.'
      );
      process.exit(1);
    }
    unlinkSync(hookPath);
    console.log('Wingman: removed the pre-push hook.');
    return;
  }

  mkdirSync(hooksDir, { recursive: true });

  if (existsSync(hookPath)) {
    const existing = readExistingHook(hookPath);
    if (existing.includes(MARKER)) {
      console.log('Wingman: pre-push hook already installed, nothing to do.');
      return;
    }
    console.error(
      'Wingman: .git/hooks/pre-push already exists and was not installed by this script. Not ' +
      'overwriting it -- merge dod-pre-push-check.mjs\'s call into your existing hook by hand, or ' +
      'move the existing hook aside first if you want this installer to manage it.'
    );
    process.exit(1);
  }

  writeFileSync(hookPath, buildWrapper(repoDir));
  chmodSync(hookPath, 0o755);
  console.log(`Wingman: installed .git/hooks/pre-push -- \`git push\` in this repo now runs the ` +
    `Boardroom-verdict / test / threat-register checks before pushing. Uninstall any time with ` +
    `--uninstall.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
