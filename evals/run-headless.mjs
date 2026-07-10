#!/usr/bin/env node
// Headless behavioral-eval runner for CI's scheduled/dispatch tier (see
// .github/workflows/evals.yml). This is the "actually run the harness on a
// schedule and capture transcripts" half of the eval story; the *grading*
// half stays human/independent, exactly as evals/README.md describes, because
// grading these behavioral cases reliably still needs a real check against the
// filesystem, not a self-report (this project's core discipline).
//
// What it does per selected case: set up that case's fixture in a temp dir,
// then drive the skill/command under test through `claude -p` headless with
// ANTHROPIC_API_KEY, capturing the transcript to evals/.artifacts/ for a human
// to grade. It reports run/skip/error counts; it does NOT claim a pass.
//
// Runs WITHOUT a key in --dry-run (or when ANTHROPIC_API_KEY is unset): it
// prints the plan and verifies every selected case references a real fixture
// and skill/command file — a genuine integrity check, usable locally and in
// any environment. No dependencies beyond Node's stdlib.

import { readFileSync, readdirSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const casesDir = join(repoRoot, 'evals', 'cases');
const fixturesDir = join(repoRoot, 'evals', 'fixtures');
const artifactsDir = join(repoRoot, 'evals', '.artifacts');

const args = process.argv.slice(2);
const depthArg = (() => {
  const i = args.indexOf('--depth');
  return i >= 0 && args[i + 1] ? args[i + 1] : 'standard';
})();
const dryRun = args.includes('--dry-run') || !process.env.ANTHROPIC_API_KEY;
const DEPTH_COUNTS = { quick: 1, standard: 3, deep: Infinity };
const wanted = DEPTH_COUNTS[depthArg] ?? DEPTH_COUNTS.standard;

// Discover cases and the fixture each references (first setup-*.sh mention).
const cases = readdirSync(casesDir)
  .filter((f) => f.endsWith('.md'))
  .sort()
  .map((f) => {
    const body = readFileSync(join(casesDir, f), 'utf-8');
    const fx = body.match(/setup-[a-z0-9-]+\.sh/i);
    return { name: f.replace(/\.md$/, ''), fixture: fx ? fx[0] : null };
  });

const selected = cases.slice(0, wanted === Infinity ? cases.length : wanted);

function summaryLine(s) {
  console.log(s);
  if (process.env.GITHUB_STEP_SUMMARY) {
    try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, s + '\n'); } catch { /* ignore */ }
  }
}

summaryLine(`## Headless eval run — depth=${depthArg}${dryRun ? ' (dry-run)' : ''}`);
summaryLine(`Selected ${selected.length}/${cases.length} case(s).`);

// Integrity check (runs in every mode): every selected case must reference a
// fixture that exists on disk.
const missing = [];
for (const c of selected) {
  if (!c.fixture) { missing.push(`${c.name}: no fixture referenced in case doc`); continue; }
  if (!existsSync(join(fixturesDir, c.fixture))) missing.push(`${c.name}: references ${c.fixture}, which does not exist`);
}
if (missing.length) {
  summaryLine(`\n**Integrity failures:**`);
  for (const m of missing) summaryLine(`- ${m}`);
  summaryLine('\nFAIL');
  process.exit(1);
}
summaryLine(`Fixture integrity: OK (every selected case references a real fixture).`);

if (dryRun) {
  summaryLine(`\nDry-run plan (no ANTHROPIC_API_KEY / --dry-run): would run —`);
  for (const c of selected) summaryLine(`- ${c.name} against ${c.fixture}`);
  summaryLine(`\nPASS (dry-run: nothing executed)`);
  process.exit(0);
}

// Live tier: actually drive each case through claude -p and capture the
// transcript. Best-effort — a per-case error is recorded, not fatal, so one
// flaky case doesn't sink the scheduled run.
mkdirSync(artifactsDir, { recursive: true });
let ran = 0, errored = 0;
for (const c of selected) {
  const target = mkdtempSync(join(tmpdir(), `wingman-eval-${c.name}-`));
  const out = join(artifactsDir, `${c.name}.txt`);
  try {
    execFileSync('bash', [join(fixturesDir, c.fixture), target], { stdio: 'pipe', timeout: 120_000 });
    const prompt =
      `You are running Wingman's "${c.name}" behavioral eval. Read ` +
      `evals/cases/${c.name}.md in ${repoRoot} for the procedure, then apply the ` +
      `skill/command under test to the throwaway project at ${target}. Do the real ` +
      `work and report exactly what you did and what you found — do not fabricate results.`;
    const transcript = execFileSync(
      'claude',
      ['-p', prompt, '--permission-mode', 'bypassPermissions'],
      { stdio: 'pipe', timeout: 1_800_000, encoding: 'utf-8' }
    );
    writeFileSync(out, transcript);
    ran++;
    summaryLine(`- ✓ ran ${c.name} (transcript: evals/.artifacts/${c.name}.txt) — grade manually`);
  } catch (err) {
    errored++;
    const detail = (err.stderr || err.message || '').toString().trim().split('\n').slice(-2).join(' | ');
    writeFileSync(out, `ERROR running ${c.name}: ${detail}\n`);
    summaryLine(`- ✗ error on ${c.name}: ${detail}`);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
}

summaryLine(`\nRan ${ran}, errored ${errored}. Transcripts uploaded as an artifact for human grading.`);
// The scheduled run is informational; a per-case error shouldn't fail the job
// (a real behavioral regression is judged by a human reading the transcript).
process.exit(0);
