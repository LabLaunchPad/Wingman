#!/usr/bin/env node
// PreToolUse hook, matched on both ExitPlanMode and Bash (see hooks.json) —
// a sibling to boardroom-checkpoint.mjs, not a merge into it: this hook checks
// artifact PRESENCE (a test file exists, a traceability marker exists, the
// threat register has zero OPEN rows), never semantic QUALITY (is the test
// good, is the code correct) — that stays a Boardroom/human judgment call,
// same division of labor secret-guard.mjs already draws between deterministic
// backstop and judgment.
//
// Two registrations, deliberately narrow in scope to avoid the false-positive
// over-block class of bug boardroom-checkpoint.mjs's own v12.1 fix already had
// to correct once:
//
//   1. ExitPlanMode — light check, traceability only. Only engages when the
//      plan text contains "## Planning Milestone checkpoint" (a heading unique
//      to commands/implementation-planning.md), so an unrelated ExitPlanMode
//      call elsewhere (including Wingman's own dev-planning sessions, which
//      have zero wingman:req markers by design) is never touched.
//   2. Bash matching a real `git push` — the full 4-point check (traceability,
//      test presence, test suite actually passing, threat register), gating
//      the actual shipping action, against the most recent Build-stage
//      checkpoint in .wingman/checkpoints.jsonl. If no such checkpoint exists
//      yet, this isn't a Wingman-piloted project (or Build hasn't run) —
//      allow, don't block ordinary git usage outside Wingman's own pipeline.
//
// Why a 4th check (added after a real eval run, seven-stage-pipeline-e2e,
// caught the exact gap it closes): "a test file exists" is presence, not
// correctness. In that run, a subagent wrote a test file mirroring an
// already-verified pattern but never got a final `npm test` run in before a
// sandbox tool outage, and the resulting code was genuinely broken (2 of 9
// tests failed on independent re-run) -- yet nothing in the pipeline's own
// checkpoint recording caught it, because presence-only checking is blind to
// this exact failure mode. Actually running the project's test suite and
// checking its exit code is still a deterministic, mechanical check (no
// semantic judgment about whether a given test is well-written) -- it's the
// same category of check a CI pipeline already runs, just moved earlier, to
// the same push-time gate this hook already owns. This makes the gate
// enforce the outcome regardless of which agent (or session, or sandbox
// hiccup) wrote the code -- exactly the point of a hook over a skill.
//
// Test-runner detection is deliberately generic, not Node-specific: Wingman
// builds arbitrary founder projects in arbitrary languages, so this looks for
// whichever common project-manifest convention is actually present
// (package.json test script, pytest/pyproject.toml, go.mod, Cargo.toml,
// Gemfile) rather than assuming any one toolchain. If none is recognized,
// this specific check is skipped (allow) rather than inventing a false
// failure for an unrecognized project shape -- consistent with this hook's
// existing "don't block a project this doesn't apply to" precedent for the
// no-prior-checkpoint case below.
//
// Failure messages always name the specific check and file/ID that failed —
// never a generic "gate failed" (see boardroom-checkpoint.mjs for the same
// discipline).

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLANNING_MILESTONE_MARKER = '## Planning Milestone checkpoint';
const NO_TEST_NEEDED = /<!--\s*wingman:no-test-needed:.*?-->/i;
const TEST_FILE_HINT = /\.(test|spec)\.|_test\.|test_/;
const OPEN_ROW = /\|\s*OPEN\s*\|/i;

function readStdin() {
  try { return readFileSync(0, 'utf-8'); } catch { return ''; }
}
function allow() {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' },
  }));
  process.exit(0);
}
function deny(reason) {
  console.error(reason);
  process.exit(2);
}

function findLatestBuildCheckpoint(cwd) {
  const file = join(cwd, '.wingman', 'checkpoints.jsonl');
  if (!existsSync(file)) return null;
  let lines;
  try { lines = readFileSync(file, 'utf-8').split('\n').filter(Boolean); } catch { return null; }
  for (let i = lines.length - 1; i >= 0; i--) {
    let entry;
    try { entry = JSON.parse(lines[i]); } catch { continue; }
    const stage = entry.stage;
    const isBuild = entry.bundle === 'build' || stage === 'build' ||
      (Array.isArray(stage) && stage.includes('build'));
    if (isBuild) return entry;
  }
  return null;
}

function findMostRecentPlanFile(cwd) {
  const plansDir = join(cwd, 'docs', 'wingman', 'plans');
  try {
    const files = readdirSync(plansDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => join(plansDir, f));
    if (files.length === 0) return null;
    files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
    return readFileSync(files[0], 'utf-8');
  } catch {
    return null;
  }
}

// build.md's convention is to append the threat register directly to the
// plan file findMostRecentPlanFile() above already reads -- but a real
// dogfooding run proved a project can still end up with it in a separate
// file (e.g. docs/wingman/build/<slug>-threat-register.md), which the single
// most-recent-plan-file check silently never sees, defeating the gate on
// exactly the risk it exists to catch. This is a defensive backstop, not the
// primary mechanism: also scan docs/wingman/build/ (one level deep) for any
// markdown file and check each one too, rather than trusting only the
// documented convention held.
function findAllBuildArtifactTexts(cwd) {
  const texts = [];
  const planText = findMostRecentPlanFile(cwd);
  if (planText) texts.push(planText);
  const buildDir = join(cwd, 'docs', 'wingman', 'build');
  try {
    for (const f of readdirSync(buildDir)) {
      if (!f.endsWith('.md')) continue;
      try { texts.push(readFileSync(join(buildDir, f), 'utf-8')); } catch { /* skip unreadable */ }
    }
  } catch { /* no build/ dir -- fine, plan file (if any) is all there is */ }
  return texts;
}

// --- ExitPlanMode check: traceability only, narrowly scoped ---

export function checkPlanningMilestoneTraceability(planText) {
  if (!planText || !planText.includes(PLANNING_MILESTONE_MARKER)) {
    return { ok: true }; // not a Wingman implementation-planning checkpoint — don't touch it
  }
  const definedIds = new Set(
    [...planText.matchAll(/^\s*\|\s*((?:DISC|DEF|ARCH|UX|IP)-\d+)\s*\|/gm)].map((m) => m[1])
  );
  const referencedIds = new Set(
    [...planText.matchAll(/wingman:req\s+((?:DISC|DEF|ARCH|UX|IP)-\d+)/g)].map((m) => m[1])
  );
  const orphaned = [...referencedIds].filter((id) => !definedIds.has(id));
  if (orphaned.length > 0) {
    return { ok: false, reason: `references ID(s) never minted in this plan: ${orphaned.join(', ')}` };
  }
  return { ok: true };
}

// --- git push check: traceability + test presence + threat register ---

export function checkTestPresence(cwd, changedFiles) {
  const missing = [];
  for (const f of changedFiles) {
    if (TEST_FILE_HINT.test(f)) continue; // it's itself a test file
    if (!/\.(js|jsx|ts|tsx|mjs|py|rb|go|java|rs)$/.test(f)) continue; // not source
    let content = '';
    try { content = readFileSync(join(cwd, f), 'utf-8'); } catch { continue; }
    if (NO_TEST_NEEDED.test(content)) continue; // logged escape hatch
    const base = f.replace(/\.[^.]+$/, '');
    const baseName = f.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
    const ext = f.match(/\.([^./]+)$/)?.[1] || 'js';
    const candidates = [
      `${base}.test.js`, `${base}.test.ts`, `${base}.spec.js`, `${base}.spec.ts`,
      f.replace(/\/([^/]+)\.([^./]+)$/, '/__tests__/$1.test.$2'),
      f.replace(/\/([^/]+)\.([^./]+)$/, '/test_$1.$2'),
      // Top-level test/ or tests/ directory, sibling to src/ (a common
      // convention this heuristic previously missed entirely -- caught by a
      // real eval run against a fixture using exactly this layout).
      `test/${baseName}.test.${ext}`, `test/${baseName}.spec.${ext}`, `test/test_${baseName}.${ext}`,
      `tests/${baseName}.test.${ext}`, `tests/${baseName}.spec.${ext}`, `tests/test_${baseName}.${ext}`,
    ];
    const hasTest = candidates.some((c) => existsSync(join(cwd, c)));
    if (!hasTest) missing.push(f);
  }
  return missing;
}

export function checkThreatRegisterClean(planText) {
  if (!planText) return { ok: true }; // no plan/build artifact found — nothing to check against
  return { ok: !OPEN_ROW.test(planText) };
}

// Checks every build-artifact text found (plan file + anything under
// docs/wingman/build/), not just one -- an OPEN row in ANY of them fails the
// gate. See findAllBuildArtifactTexts()'s comment for why this exists.
export function checkThreatRegisterCleanAcrossArtifacts(texts) {
  for (const text of texts) {
    if (OPEN_ROW.test(text)) return { ok: false };
  }
  return { ok: true };
}

// Detect the project's own declared test command generically -- Wingman
// builds arbitrary founder projects, not just Node.js ones (also used by
// hooks that ship with the plugin, so this must not assume the runtime
// Wingman itself happens to be built in). Returns null if nothing
// recognizable is present, so the caller can skip the check rather than
// invent a false failure.
export function detectTestCommand(cwd) {
  if (existsSync(join(cwd, 'package.json'))) {
    try {
      const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf-8'));
      if (pkg.scripts && pkg.scripts.test && !/no test specified/i.test(pkg.scripts.test)) {
        return { command: 'npm', args: ['test', '--silent'] };
      }
    } catch { /* malformed package.json -- fall through to other conventions */ }
  }
  if (existsSync(join(cwd, 'pytest.ini')) || existsSync(join(cwd, 'pyproject.toml')) || existsSync(join(cwd, 'setup.py'))) {
    return { command: 'python3', args: ['-m', 'pytest', '-q'] };
  }
  if (existsSync(join(cwd, 'go.mod'))) {
    return { command: 'go', args: ['test', './...'] };
  }
  if (existsSync(join(cwd, 'Cargo.toml'))) {
    return { command: 'cargo', args: ['test'] };
  }
  if (existsSync(join(cwd, 'Gemfile'))) {
    return { command: 'bundle', args: ['exec', 'rake', 'test'] };
  }
  return null;
}

// Actually runs the detected test command and reports pass/fail -- this is
// the check that closes the gap "a test file exists" alone leaves open (see
// header). Deterministic and mechanical: it checks the exit code the
// project's own test runner reports, the same signal a CI pipeline already
// trusts, never a semantic judgment of test quality.
export function runTestSuite(cwd, testCmd) {
  if (!testCmd) return { ok: true, skipped: true }; // no recognized runner -- not this check's concern
  try {
    execFileSync(testCmd.command, testCmd.args, {
      cwd,
      encoding: 'utf-8',
      timeout: 120_000, // a hung suite must not hang the gate indefinitely
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true };
  } catch (err) {
    const output = String(err.stdout || '') + String(err.stderr || '');
    return { ok: false, output: output.slice(-2000) }; // tail only -- keep the deny message readable
  }
}

function getChangedFiles(cwd, baseRef) {
  // A bad or unreachable baseRef (e.g. HEAD~20 in a repo with fewer commits)
  // must not silently degrade to "no changed files" -- that would skip the
  // test-presence check entirely rather than fail it, the opposite of this
  // hook's fail-closed intent. Fall back to the repo's first commit (or the
  // empty tree, if HEAD itself is the first commit) before giving up.
  const candidates = [baseRef];
  try {
    const rootCommit = execFileSync('git', ['rev-list', '--max-parents=0', 'HEAD'], { cwd, encoding: 'utf-8' }).trim().split('\n')[0];
    if (rootCommit) candidates.push(rootCommit);
  } catch { /* not a git repo, or no commits yet */ }
  candidates.push('4b825dc642cb6eb9a060e54bf8d69288fbee4904'); // git's canonical empty tree hash

  for (const ref of candidates) {
    try {
      const out = execFileSync('git', ['diff', '--name-only', `${ref}..HEAD`], { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      return out.split('\n').filter(Boolean);
    } catch { /* try next candidate */ }
  }
  return [];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let input;
  try {
    input = JSON.parse(readStdin());
  } catch {
    allow(); // malformed input isn't routine traffic for this hook's matchers, but fail open here —
             // unlike boardroom-checkpoint.mjs's ExitPlanMode-only gate, this hook also fires on
             // ordinary Bash calls, so failing closed on parse errors would block unrelated work.
  }

  const toolName = input?.tool_name;

  if (toolName === 'ExitPlanMode') {
    const cwd = input.cwd || process.cwd();
    const inlinePlan = input.tool_input?.plan || '';
    const planFileText = findMostRecentPlanFile(cwd) || '';
    const result = checkPlanningMilestoneTraceability(inlinePlan);
    const fileResult = checkPlanningMilestoneTraceability(planFileText);
    const failed = !result.ok ? result : (!fileResult.ok ? fileResult : null);
    if (failed) {
      deny(
        `Wingman dod-structural-gate: this Planning Milestone checkpoint ${failed.reason}. ` +
        `Fix the marker(s) via the traceability-linking skill before exiting plan mode.`
      );
    }
    allow();
  }

  if (toolName === 'Bash') {
    const command = String(input.tool_input?.command || '');
    if (!/\bgit\s+push\b/.test(command)) allow();

    const cwd = input.cwd || process.cwd();
    const checkpoint = findLatestBuildCheckpoint(cwd);
    if (!checkpoint) allow(); // no Build-stage checkpoint recorded yet — not this hook's concern

    // 1. Traceability — delegate to check-traceability.mjs against the whole project.
    const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
    const traceScript = join(pluginRoot, 'scripts', 'check-traceability.mjs');
    if (existsSync(traceScript)) {
      try {
        execFileSync('node', [traceScript, cwd], { encoding: 'utf-8' });
      } catch (err) {
        const output = String(err.stdout || err.message || '');
        deny(`Wingman dod-structural-gate: traceability check failed before push.\n${output}`);
      }
    }

    // 2. Test presence — for files changed since the last Build checkpoint's commit, if known;
    // otherwise fall back to the default branch merge-base as a reasonable diff range.
    const baseRef = checkpoint.commit_sha || 'HEAD~20';
    const changedFiles = getChangedFiles(cwd, baseRef);
    const missingTests = checkTestPresence(cwd, changedFiles);
    if (missingTests.length > 0) {
      deny(
        `Wingman dod-structural-gate: no test file found for: ${missingTests.join(', ')}. ` +
        `Add a test, or mark the change with <!-- wingman:no-test-needed: <reason> --> if it ` +
        `genuinely doesn't need one (e.g. docs/config-only).`
      );
    }

    // 3. Test suite actually passing — not just a test file existing (see header:
    // this closes the exact gap seven-stage-pipeline-e2e's real run caught).
    const testCmd = detectTestCommand(cwd);
    const testRunResult = runTestSuite(cwd, testCmd);
    if (!testRunResult.ok) {
      deny(
        `Wingman dod-structural-gate: the project's test suite (${testCmd.command} ${testCmd.args.join(' ')}) ` +
        `is failing. A test file existing is not the same as it passing — fix the failure before pushing.\n${testRunResult.output || ''}`
      );
    }

    // 4. Threat register — zero OPEN rows across every plan/build artifact found
    // (plan file AND anything under docs/wingman/build/, not just one of them).
    const artifactTexts = findAllBuildArtifactTexts(cwd);
    const threatResult = checkThreatRegisterCleanAcrossArtifacts(artifactTexts);
    if (!threatResult.ok) {
      deny(
        `Wingman dod-structural-gate: the threat register still has an OPEN row. ` +
        `Close it or get explicit founder acceptance (see build.md's Definition-of-Done gate) before pushing.`
      );
    }

    allow();
  }

  allow();
}
