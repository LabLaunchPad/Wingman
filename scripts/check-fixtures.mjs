#!/usr/bin/env node
// Deterministic eval-fixture smoke check (complements the behavioral eval
// harness in evals/, which needs a model and is run separately). Every
// evals/fixtures/setup-*.sh takes a target dir, wipes+recreates it, and
// `git init`s a throwaway test project. This runs each one into a temp dir
// and asserts it (a) exits 0 and (b) produces a non-empty git repo -- so a
// broken fixture is caught on every PR, cheaply, with no API key. It does NOT
// grade behavior; that's the model-in-the-loop half in evals/cases/.
//
// No dependencies beyond Node's stdlib. Mirrors validate-structure.mjs /
// check-repo-consistency.mjs: read-only w.r.t. the repo, exit 1 on failure.

import { readdirSync, existsSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { execFile, execSync } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join } from 'node:path';
import { tmpdir, cpus } from 'node:os';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const fixturesDir = join(repoRoot, 'evals', 'fixtures');

// Detect bash availability. On Windows (where bash is absent in a standard Node
// shell), skip gracefully rather than failing — the deterministic gate only runs
// on the ubuntu CI runner per CLAUDE.md.
const HAS_BASH = (() => {
  try { execSync('bash --version', { stdio: 'ignore' }); return true; }
  catch { return false; }
})();

let fixtures = [];
try {
  fixtures = readdirSync(fixturesDir)
    .filter((f) => f.startsWith('setup-') && f.endsWith('.sh'))
    .sort();
} catch {
  console.error(`No fixtures dir at ${fixturesDir}`);
  process.exit(1);
}

if (fixtures.length === 0) {
  console.error('No setup-*.sh fixtures found — expected at least one.');
  process.exit(1);
}

if (!HAS_BASH) {
  console.log(`Detected no bash in PATH — this gate runs on the ubuntu CI runner (see CLAUDE.md).`);
  console.log(`Skipping ${fixtures.length} fixture(s) cleanly on this platform.\n`);
  console.log('PASS (bash unavailable — skipped)');
  process.exit(0);
}

async function checkOne(f) {
  const script = join(fixturesDir, f);
  const target = mkdtempSync(join(tmpdir(), 'wingman-fixture-'));
  const localFailures = [];
  try {
    await execFileAsync('bash', [script, target], {
      timeout: 60_000,
      // Fixtures git-init and commit but don't set a local identity — they
      // were only ever exercised in environments with an ambient global git
      // config, which a fresh CI runner doesn't have ("empty ident name").
      // Inject one here so this check is hermetic instead of depending on
      // whatever happens to be configured on the machine running it.
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 'Wingman Fixture Check',
        GIT_AUTHOR_EMAIL: 'fixture-check@wingman.local',
        GIT_COMMITTER_NAME: 'Wingman Fixture Check',
        GIT_COMMITTER_EMAIL: 'fixture-check@wingman.local',
      },
    });
    // A fixture must produce a real, non-empty git project.
    const entries = readdirSync(target);
    if (entries.length === 0) {
      localFailures.push(`${f}: ran cleanly but produced an empty target dir`);
    } else if (!existsSync(join(target, '.git'))) {
      localFailures.push(`${f}: produced no .git — fixtures are expected to git init their project`);
    } else {
      // Optional fixture-signal-integrity check (FIXLOG.md T4): a fixture may
      // write a `.wingman-fixture-manifest` file (one relative path per line)
      // listing the specific signal files it promises to plant (e.g. a
      // Dockerfile to trigger DevOps detection). If present, verify every
      // listed path actually exists -- catches a fixture that still runs
      // cleanly and produces *some* project, but silently stopped planting
      // the signal its own case file says it tests. Fixtures without a
      // manifest are unaffected (this is additive, not retroactively
      // required across all existing fixtures).
      const manifestPath = join(target, '.wingman-fixture-manifest');
      if (existsSync(manifestPath)) {
        const promised = readFileSync(manifestPath, 'utf-8')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        for (const rel of promised) {
          if (!existsSync(join(target, rel))) {
            localFailures.push(`${f}: manifest promised "${rel}" but it's missing from the fixture output`);
          }
        }
      }
    }
  } catch (err) {
    const detail = err.stderr ? err.stderr.toString().trim().split('\n').slice(-3).join(' | ') : err.message;
    localFailures.push(`${f}: setup script failed — ${detail}`);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
  return localFailures;
}

// Fixtures are independent (each gets its own tmpdir) so they're safe to run
// concurrently. Bounded to avoid spawning 40+ bash+git processes at once on
// small CI runners; unbounded via Promise.all was the original PERF3 finding.
const CONCURRENCY = Math.max(1, Math.min(cpus().length, 6));
const failures = [];
{
  const queue = [...fixtures];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const f = queue.shift();
      failures.push(...(await checkOne(f)));
    }
  });
  await Promise.all(workers);
}

console.log(`Checked ${fixtures.length} eval fixtures: each runs cleanly and produces a git project`);

if (failures.length) {
  console.log(`\n${failures.length} failure(s):`);
  for (const x of failures) console.log(`  - ${x}`);
  console.log('\nFAIL');
  process.exit(1);
}
console.log('\nPASS');
