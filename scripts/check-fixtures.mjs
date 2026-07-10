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

import { readdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const fixturesDir = join(repoRoot, 'evals', 'fixtures');

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

const failures = [];

for (const f of fixtures) {
  const script = join(fixturesDir, f);
  const target = mkdtempSync(join(tmpdir(), 'wingman-fixture-'));
  try {
    execFileSync('bash', [script, target], {
      stdio: 'pipe',
      timeout: 60_000,
    });
    // A fixture must produce a real, non-empty git project.
    const entries = readdirSync(target);
    if (entries.length === 0) {
      failures.push(`${f}: ran cleanly but produced an empty target dir`);
    } else if (!existsSync(join(target, '.git'))) {
      failures.push(`${f}: produced no .git — fixtures are expected to git init their project`);
    }
  } catch (err) {
    const detail = err.stderr ? err.stderr.toString().trim().split('\n').slice(-3).join(' | ') : err.message;
    failures.push(`${f}: setup script failed — ${detail}`);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
}

console.log(`Checked ${fixtures.length} eval fixtures: each runs cleanly and produces a git project`);

if (failures.length) {
  console.log(`\n${failures.length} failure(s):`);
  for (const x of failures) console.log(`  - ${x}`);
  console.log('\nFAIL');
  process.exit(1);
}
console.log('\nPASS');
