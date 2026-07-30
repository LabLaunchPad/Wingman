// Tests for scripts/check-benchmark-regression.mjs -- continuous benchmarking (PR9), automation
// over the existing agent-weakness coverage benchmark, never a new service-style metric type.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { checkRegression } from '../../scripts/check-benchmark-regression.mjs';

test('no regression when current numbers match the baseline exactly', () => {
  const baseline = { pctCovered: 92, pctMeasured: 92 };
  const current = { pctCovered: 92, pctMeasured: 92, brokenRefs: [], mismatches: [] };
  assert.deepEqual(checkRegression(baseline, current), []);
});

test('no regression when current numbers exceed the baseline', () => {
  const baseline = { pctCovered: 80, pctMeasured: 80 };
  const current = { pctCovered: 92, pctMeasured: 92, brokenRefs: [], mismatches: [] };
  assert.deepEqual(checkRegression(baseline, current), []);
});

test('a drop in coverage percentage is flagged', () => {
  const baseline = { pctCovered: 92, pctMeasured: 92 };
  const current = { pctCovered: 83, pctMeasured: 92, brokenRefs: [], mismatches: [] };
  const problems = checkRegression(baseline, current);
  assert.ok(problems.some((p) => p.includes('coverage regressed')));
});

test('a drop in measured-coverage percentage is flagged', () => {
  const baseline = { pctCovered: 92, pctMeasured: 92 };
  const current = { pctCovered: 92, pctMeasured: 75, brokenRefs: [], mismatches: [] };
  const problems = checkRegression(baseline, current);
  assert.ok(problems.some((p) => p.includes('measured-coverage regressed')));
});

test('a broken reference is flagged even with no percentage drop', () => {
  const baseline = { pctCovered: 92, pctMeasured: 92 };
  const current = { pctCovered: 92, pctMeasured: 92, brokenRefs: ['W3'], mismatches: [] };
  const problems = checkRegression(baseline, current);
  assert.ok(problems.some((p) => p.includes('broken reference') && p.includes('W3')));
});

test('a status mismatch is flagged even with no percentage drop', () => {
  const baseline = { pctCovered: 92, pctMeasured: 92 };
  const current = { pctCovered: 92, pctMeasured: 92, brokenRefs: [], mismatches: [{ id: 'W5' }] };
  const problems = checkRegression(baseline, current);
  assert.ok(problems.some((p) => p.includes('status mismatch')));
});

test('the real repo state passes clean against the real recorded baseline right now', () => {
  const repoRoot = join(process.cwd());
  const baseline = JSON.parse(readFileSync(join(repoRoot, 'docs/status/benchmark-baseline.json'), 'utf-8'));
  const result = spawnSync('node', [join(repoRoot, 'scripts/wingman-metrics.mjs'), '--json'], {
    encoding: 'utf-8',
    cwd: repoRoot,
  });
  assert.strictEqual(result.status, 0);
  const current = JSON.parse(result.stdout).weaknessBenchmark;
  assert.deepEqual(checkRegression(baseline, current), []);
});
