#!/usr/bin/env node
// Runs the same 6 checks CI's `validate.yml` runs, in one command, instead of requiring whoever's
// working in this repo to remember and type all 6 separately every time. This is dev-repo-only
// tooling (root `scripts/`, never ships with the plugin) -- see AGENTS.md's "shipped vs. dev-only
// scripts" boundary.
//
// Real incident this addresses: PR #122 pushed a stray `<<<<<<< HEAD` conflict-marker line to
// `main` because the person merging (an AI agent, across many sessions) ran some of the 6 checks
// by hand but not all of them, and nothing forced the full set before the push. A single command
// that runs everything removes the "did I remember all 6" question entirely.
//
// Usage:
//   node scripts/validate-all.mjs         -- all 6 checks (same set CI runs)
//   node scripts/validate-all.mjs --fast  -- skips check-fixtures.mjs (the slowest -- it spins up
//                                            67 real git projects) for a quick pre-commit gate;
//                                            still run the full set before actually pushing.

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const CHECKS = [
  { name: 'validate-structure', cmd: ['node', 'plugins/wingman/scripts/validate-structure.mjs'] },
  { name: 'check-repo-consistency', cmd: ['node', 'scripts/check-repo-consistency.mjs'] },
  { name: 'check-fixtures', cmd: ['node', 'scripts/check-fixtures.mjs'], slow: true },
  { name: 'check-traceability', cmd: ['node', 'plugins/wingman/scripts/check-traceability.mjs'] },
  { name: 'check-harness-adapter-drift', cmd: ['node', 'plugins/wingman/scripts/check-harness-adapter-drift.mjs'] },
  { name: 'generate-harness-adapters --check', cmd: ['node', 'plugins/wingman/scripts/generate-harness-adapters.mjs', '--check'] },
];

function main() {
  const fast = process.argv.includes('--fast');
  const checks = fast ? CHECKS.filter((c) => !c.slow) : CHECKS;

  const results = [];
  for (const check of checks) {
    const start = Date.now();
    const result = spawnSync(check.cmd[0], check.cmd.slice(1), { cwd: repoRoot, encoding: 'utf-8' });
    const ms = Date.now() - start;
    const pass = result.status === 0;
    results.push({ name: check.name, pass, ms, output: result.stdout + result.stderr });
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${check.name}  (${ms}ms)`);
    if (!pass) {
      console.log(result.stdout || '');
      console.log(result.stderr || '');
    }
  }

  const failed = results.filter((r) => !r.pass);
  console.log('');
  if (failed.length > 0) {
    console.log(`${failed.length}/${results.length} check(s) failed: ${failed.map((f) => f.name).join(', ')}`);
    console.log('\nFAIL');
    process.exit(1);
  }
  console.log(`All ${results.length} check(s) passed${fast ? ' (--fast: check-fixtures skipped, run the full set before pushing)' : ''}.`);
  console.log('\nPASS');
}

main();
