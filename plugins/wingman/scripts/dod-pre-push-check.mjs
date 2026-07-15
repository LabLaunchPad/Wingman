#!/usr/bin/env node
// Plain-git fallback for dod-structural-gate.mjs's `git push` checks — for any coding-agent
// harness (or human) with no Claude-Code-style PreToolUse hook mechanism at all. Reuses the exact
// same pure, already-tested functions the Claude Code hook exports; no new decision logic here.
//
// This is the one concrete, buildable piece of the fablize-derived agent-agnosticism pass (see
// docs/wingman/architecture-audit-2026-07-15.md and plugins/wingman/references/fablize-pattern.md):
// keep harness-specific wiring (hooks.json's PreToolUse/Bash matcher) separate from the portable
// decision logic (this same set of pure functions), so the logic has a real, working invocation
// path outside Claude Code's own hook system, not just a documented aspiration.
//
// Usage: node dod-pre-push-check.mjs <repo-dir>
//   exit 0 = ok to push, exit 1 = blocked (message printed to stderr, matching git's own
//   pre-push hook contract: a non-zero exit aborts the push).
//
// Install as a real git hook (either works, no Claude Code involvement in either):
//   ln -s ../../plugins/wingman/scripts/dod-pre-push-check.mjs .git/hooks/pre-push  (then chmod +x)
//   or call it from a package.json "prepush"/husky "pre-push" script.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findLatestBuildCheckpoint,
  findAllBuildArtifactTexts,
  getChangedFiles,
  checkBoardroomVerdictClean,
  checkTestPresence,
  checkThreatRegisterCleanAcrossArtifacts,
  detectTestCommand,
  runTestSuite,
} from '../hooks/dod-structural-gate.mjs';

function fail(reason) {
  console.error(`dod-pre-push-check: ${reason}`);
  process.exit(1);
}

function run(cwd) {
  const checkpoint = findLatestBuildCheckpoint(cwd);
  if (!checkpoint) {
    console.log('dod-pre-push-check: no Build-stage checkpoint recorded yet — not this check\'s concern, allowing push.');
    return;
  }

  const verdictResult = checkBoardroomVerdictClean(checkpoint);
  if (!verdictResult.ok) {
    fail(`the most recent Build-stage Boardroom checkpoint recorded a blocking verdict — ${verdictResult.reason}. A checkpoint existing is not the same as it having actually passed.`);
  }

  const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
  const traceScript = join(pluginRoot, 'scripts', 'check-traceability.mjs');
  if (existsSync(traceScript)) {
    try {
      execFileSync('node', [traceScript, cwd], { encoding: 'utf-8' });
    } catch (err) {
      fail(`traceability check failed before push.\n${String(err.stdout || err.message || '')}`);
    }
  }

  const baseRef = checkpoint.commit_sha || 'HEAD~20';
  const changedFiles = getChangedFiles(cwd, baseRef);
  const missingTests = checkTestPresence(cwd, changedFiles);
  if (missingTests.length > 0) {
    fail(`no test file found for: ${missingTests.join(', ')}. Add a test, or mark the change with <!-- wingman:no-test-needed: <reason> --> if it genuinely doesn't need one.`);
  }

  const testCmd = detectTestCommand(cwd);
  const testRunResult = runTestSuite(cwd, testCmd);
  if (!testRunResult.ok) {
    fail(`the project's test suite (${testCmd.command} ${testCmd.args.join(' ')}) is failing. A test file existing is not the same as it passing.\n${testRunResult.output || ''}`);
  }

  const artifactTexts = findAllBuildArtifactTexts(cwd);
  const threatResult = checkThreatRegisterCleanAcrossArtifacts(artifactTexts);
  if (!threatResult.ok) {
    fail('the threat register still has an OPEN row. Close it or get explicit founder acceptance before pushing.');
  }

  console.log('dod-pre-push-check: all checks passed.');
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  const cwd = process.argv[2] || process.cwd();
  run(cwd);
}
