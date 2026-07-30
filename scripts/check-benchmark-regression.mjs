#!/usr/bin/env node
// Continuous benchmarking (PR9 of the AI Engineering Operating System build): a scheduled check
// (.github/workflows/benchmark-schedule.yml) that the agent-weakness coverage benchmark
// (docs/status/AGENT-WEAKNESS-BENCHMARK.md, scored by wingman-metrics.mjs §5) doesn't silently
// regress over time.
//
// This is deliberately NOT a service-style MLOps benchmark (p95 latency, throughput, cache-hit-
// rate) -- that shape was assessed and declined twice already (docs/status/PROJECT.md's decisions
// log), because Wingman has no persistent runtime or request traffic to instrument against
// (docs/status/ARCHITECTURE.md §2). This is automation over a metric that already exists and is
// already computed from real files -- no new metric type, no fabricated numbers.
//
// Dev-repo-only (like wingman-metrics.mjs itself): reads/writes docs/status/, runs entirely from
// files already in this repo, never ships with the plugin.
//
// Split from the I/O for the same reason constitution-check.mjs/wkos-check.mjs are: a script that
// runs its whole pass at import time cannot be tested without executing it as a side effect.
//
// Usage: node scripts/check-benchmark-regression.mjs                  # check against baseline
//        node scripts/check-benchmark-regression.mjs --update-baseline  # raise the baseline (only
//                                                                          if current >= recorded)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const baselinePath = join(repoRoot, 'docs/status/benchmark-baseline.json');

/**
 * @param {{ pctCovered: number, pctMeasured: number }} baseline
 * @param {{ pctCovered: number, pctMeasured: number, brokenRefs: string[], mismatches: unknown[] }} current
 * @returns {string[]} problems; empty if no regression
 */
export function checkRegression(baseline, current) {
  const problems = [];
  if (current.pctCovered < baseline.pctCovered) {
    problems.push(
      `coverage regressed: ${current.pctCovered}% covered, baseline requires at least ${baseline.pctCovered}%`
    );
  }
  if (current.pctMeasured < baseline.pctMeasured) {
    problems.push(
      `measured-coverage regressed: ${current.pctMeasured}% measured, baseline requires at least ${baseline.pctMeasured}%`
    );
  }
  if (current.brokenRefs.length > 0) {
    problems.push(`broken reference(s) in the weakness catalog: ${current.brokenRefs.join(', ')}`);
  }
  if (current.mismatches.length > 0) {
    problems.push(`status mismatch(es) in the weakness catalog: ${current.mismatches.length} entrie(s)`);
  }
  return problems;
}

function runMetrics() {
  const result = spawnSync('node', [join(repoRoot, 'scripts/wingman-metrics.mjs'), '--json'], {
    encoding: 'utf-8',
    cwd: repoRoot,
  });
  if (result.status !== 0) {
    console.error('FATAL: wingman-metrics.mjs failed to run:', result.stderr);
    process.exit(1);
  }
  return JSON.parse(result.stdout).weaknessBenchmark;
}

function main() {
  if (!existsSync(baselinePath)) {
    console.error(`FATAL: ${baselinePath} not found -- nothing to check against`);
    process.exit(1);
  }
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf-8'));
  const current = runMetrics();

  if (process.argv.includes('--update-baseline')) {
    if (current.pctCovered < baseline.pctCovered || current.pctMeasured < baseline.pctMeasured) {
      console.error(
        `Refusing to update baseline: current numbers (${current.pctCovered}%/${current.pctMeasured}%) are below the recorded floor (${baseline.pctCovered}%/${baseline.pctMeasured}%) -- fix the regression first, don't lower the bar.`
      );
      process.exit(1);
    }
    writeFileSync(
      baselinePath,
      JSON.stringify(
        {
          pctCovered: current.pctCovered,
          pctMeasured: current.pctMeasured,
          recordedAt: new Date().toISOString().slice(0, 10),
          note: baseline.note,
        },
        null,
        2
      ) + '\n'
    );
    console.log(`Baseline updated: ${current.pctCovered}% covered, ${current.pctMeasured}% measured.`);
    return;
  }

  const problems = checkRegression(baseline, current);
  if (problems.length) {
    console.log(`${problems.length} problem(s) against baseline (recorded ${baseline.recordedAt}):`);
    for (const p of problems) console.log(`  - ${p}`);
    console.log('\nFAIL');
    process.exit(1);
  }
  console.log(
    `Agent-weakness coverage benchmark: ${current.pctCovered}% covered, ${current.pctMeasured}% measured -- at or above baseline (${baseline.pctCovered}%/${baseline.pctMeasured}%, recorded ${baseline.recordedAt}).\nPASS`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
