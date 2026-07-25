/**
 * dod-gate.js (OpenCode adapter) Unit Tests
 *
 * Real, in-process verification of the pure decision functions ported from
 * plugins/wingman/hooks/dod-structural-gate.mjs's `git push` half -- the part of the OpenCode
 * plugin with zero OpenCode-specific dependency (file reads against a project's own
 * .wingman/checkpoints.jsonl, plan/build artifact markdown, and the project's own test runner),
 * confirmed independently testable per the file's own header comment.
 *
 * This does NOT re-test the plugin's OpenCode wiring (`tool.execute.before` matched against
 * `bash` + a `git push` command) -- that was confirmed working via a real live
 * `opencode run -m opencode/deepseek-v4-flash-free` session, documented in dod-gate.js's own
 * header. These tests exist so the decision logic itself has real, fast, in-process regression
 * coverage independent of that live session.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  checkBoardroomVerdictClean,
  checkVerdictTranscriptionMatchesDetails,
  checkTestPresence,
  checkThreatRegisterCleanAcrossArtifacts,
  evaluateGitPush,
} from '../../plugins/wingman/references/harness-adapters/opencode/.opencode/plugin/dod-gate.js';

function freshDir() {
  return mkdtempSync(join(tmpdir(), 'dod-gate-test-'));
}

function writeCheckpoints(dir, entries) {
  mkdirSync(join(dir, '.wingman'), { recursive: true });
  const lines = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
  writeFileSync(join(dir, '.wingman', 'checkpoints.jsonl'), lines);
}

function initGitRepo(dir) {
  const env = { ...process.env, GIT_AUTHOR_NAME: 'test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'test', GIT_COMMITTER_EMAIL: 'test@example.com' };
  execFileSync('git', ['init', '-q'], { cwd: dir, env });
  execFileSync('git', ['add', '-A'], { cwd: dir, env });
  execFileSync('git', ['commit', '-q', '-m', 'initial'], { cwd: dir, env });
}

describe('dod-gate.js checkBoardroomVerdictClean', () => {
  it('allows a checkpoint with a clean GO bottom line and no NO_GO seats', () => {
    const result = checkBoardroomVerdictClean({
      bottom_line: 'GO',
      seats: [{ seat: 'CTO', verdict: 'GO' }, { seat: 'CISO', verdict: 'GO_WITH_CONCERNS' }],
    });
    assert.deepStrictEqual(result, { ok: true });
  });

  it('blocks a checkpoint whose bottom line is DO NOT SHIP', () => {
    const result = checkBoardroomVerdictClean({ bottom_line: 'DO NOT SHIP', seats: [] });
    assert.strictEqual(result.ok, false);
    assert.match(result.reason, /DO NOT SHIP/);
  });

  it('blocks a checkpoint with a clean bottom line but a NO_GO seat', () => {
    const result = checkBoardroomVerdictClean({
      bottom_line: 'GO',
      seats: [{ seat: 'CISO', verdict: 'NO_GO' }],
    });
    assert.strictEqual(result.ok, false);
    assert.match(result.reason, /CISO/);
    assert.match(result.reason, /NO_GO/);
  });
});

describe('dod-gate.js checkVerdictTranscriptionMatchesDetails', () => {
  it('allows when there is no details_ref to cross-check', () => {
    const result = checkVerdictTranscriptionMatchesDetails({ seats: [] }, freshDir());
    assert.deepStrictEqual(result, { ok: true });
  });

  it('allows when the raw seat verdict matches the recorded verdict', () => {
    const dir = freshDir();
    writeFileSync(join(dir, 'details.md'), '## CISO VERDICT: GO_WITH_CONCERNS\nsome detail text');
    const result = checkVerdictTranscriptionMatchesDetails(
      { details_ref: 'details.md', seats: [{ seat: 'CISO', verdict: 'GO_WITH_CONCERNS' }] },
      dir
    );
    assert.deepStrictEqual(result, { ok: true });
  });

  it('blocks when the raw seat verdict block disagrees with the recorded verdict', () => {
    const dir = freshDir();
    writeFileSync(join(dir, 'details.md'), '## CISO VERDICT: NO_GO\nsome detail text');
    const result = checkVerdictTranscriptionMatchesDetails(
      { details_ref: 'details.md', seats: [{ seat: 'CISO', verdict: 'GO_WITH_CONCERNS' }] },
      dir
    );
    assert.strictEqual(result.ok, false);
    assert.match(result.reason, /CISO/);
    assert.match(result.reason, /transcription mismatch/);
  });
});

describe('dod-gate.js checkTestPresence', () => {
  it('flags a changed source file with no corresponding test anywhere', () => {
    const dir = freshDir();
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'src', 'widget.js'), 'module.exports = () => 1;\n');
    const missing = checkTestPresence(dir, ['src/widget.js']);
    assert.deepStrictEqual(missing, ['src/widget.js']);
  });

  it('does not flag a changed source file that has a matching test file', () => {
    const dir = freshDir();
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'src', 'widget.js'), 'module.exports = () => 1;\n');
    writeFileSync(join(dir, 'src', 'widget.test.js'), 'require("./widget");\n');
    const missing = checkTestPresence(dir, ['src/widget.js']);
    assert.deepStrictEqual(missing, []);
  });
});

describe('dod-gate.js checkThreatRegisterCleanAcrossArtifacts', () => {
  it('allows when every threat-register row is CLOSED', () => {
    const text = [
      '## Threat Register',
      '| ID | Threat | Status | Disposition |',
      '| --- | --- | --- | --- |',
      '| T1 | SQL injection | CLOSED | fixed |',
    ].join('\n');
    const result = checkThreatRegisterCleanAcrossArtifacts([text]);
    assert.deepStrictEqual(result, { ok: true });
  });

  it('blocks when any threat-register row is still OPEN', () => {
    const text = [
      '## Threat Register',
      '| ID | Threat | Status | Disposition |',
      '| --- | --- | --- | --- |',
      '| T1 | SQL injection | CLOSED | fixed |',
      '| T2 | Missing rate limiting | OPEN | tbd |',
    ].join('\n');
    const result = checkThreatRegisterCleanAcrossArtifacts([text]);
    assert.deepStrictEqual(result, { ok: false });
  });
});

describe('dod-gate.js evaluateGitPush (integration)', () => {
  it('allows a command that is not a git push, regardless of checkpoint state', () => {
    const dir = freshDir();
    writeCheckpoints(dir, [{ stage: 'build', bottom_line: 'DO NOT SHIP', seats: [] }]);
    const result = evaluateGitPush('git status', dir);
    assert.deepStrictEqual(result, { allow: true });
  });

  it('allows a git push when no Build-stage checkpoint has ever been recorded', () => {
    const dir = freshDir();
    const result = evaluateGitPush('git push origin main', dir);
    assert.deepStrictEqual(result, { allow: true });
  });

  it('blocks a git push when the most recent Build checkpoint says DO NOT SHIP', () => {
    const dir = freshDir();
    writeCheckpoints(dir, [{ stage: 'build', bottom_line: 'DO NOT SHIP', seats: [] }]);
    const result = evaluateGitPush('git push origin main', dir);
    assert.strictEqual(result.allow, false);
    assert.match(result.reason, /DO NOT SHIP/);
  });

  it('blocks a git push when the checkpoint has a verdict-transcription mismatch', () => {
    const dir = freshDir();
    writeFileSync(join(dir, 'details.md'), '## CISO VERDICT: NO_GO\nraw detail');
    writeCheckpoints(dir, [{
      stage: 'build',
      bottom_line: 'GO',
      details_ref: 'details.md',
      seats: [{ seat: 'CISO', verdict: 'GO' }],
    }]);
    const result = evaluateGitPush('git push origin main', dir);
    assert.strictEqual(result.allow, false);
    assert.match(result.reason, /transcription mismatch/);
  });

  it('blocks a git push when a changed source file has no test', () => {
    const dir = freshDir();
    writeFileSync(join(dir, 'README.md'), 'placeholder\n');
    initGitRepo(dir); // commit 1: empty-ish baseline, so widget.js below shows up as "changed"
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'src', 'widget.js'), 'module.exports = () => 1;\n');
    const env = { ...process.env, GIT_AUTHOR_NAME: 'test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'test', GIT_COMMITTER_EMAIL: 'test@example.com' };
    execFileSync('git', ['add', '-A'], { cwd: dir, env });
    execFileSync('git', ['commit', '-q', '-m', 'add widget'], { cwd: dir, env }); // commit 2
    writeCheckpoints(dir, [{ stage: 'build', bottom_line: 'GO', seats: [] }]);
    const result = evaluateGitPush('git push origin main', dir);
    assert.strictEqual(result.allow, false);
    assert.match(result.reason, /no test file found/);
    assert.match(result.reason, /widget\.js/);
  });

  it('blocks a git push when the threat register has an OPEN row (tests satisfied)', () => {
    const dir = freshDir();
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'src', 'widget.js'), 'module.exports = () => 1;\n');
    writeFileSync(join(dir, 'src', 'widget.test.js'), 'require("./widget");\n');
    mkdirSync(join(dir, 'docs', 'wingman', 'plans'), { recursive: true });
    writeFileSync(join(dir, 'docs', 'wingman', 'plans', 'plan.md'), [
      '## Threat Register',
      '| ID | Threat | Status | Disposition |',
      '| --- | --- | --- | --- |',
      '| T1 | Unvalidated input | OPEN | tbd |',
    ].join('\n'));
    initGitRepo(dir);
    writeCheckpoints(dir, [{ stage: 'build', bottom_line: 'GO', seats: [] }]);
    const result = evaluateGitPush('git push origin main', dir);
    assert.strictEqual(result.allow, false);
    assert.match(result.reason, /threat register still has an OPEN row/);
  });

  it('allows a fully clean checkpoint: tests present, no test runner detected, threat register clean', () => {
    const dir = freshDir();
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'src', 'widget.js'), 'module.exports = () => 1;\n');
    writeFileSync(join(dir, 'src', 'widget.test.js'), 'require("./widget");\n');
    mkdirSync(join(dir, 'docs', 'wingman', 'plans'), { recursive: true });
    writeFileSync(join(dir, 'docs', 'wingman', 'plans', 'plan.md'), [
      '## Threat Register',
      '| ID | Threat | Status | Disposition |',
      '| --- | --- | --- | --- |',
      '| T1 | Unvalidated input | CLOSED | fixed |',
    ].join('\n'));
    initGitRepo(dir);
    writeCheckpoints(dir, [{ stage: 'build', bottom_line: 'GO', seats: [{ seat: 'CTO', verdict: 'GO' }] }]);
    const result = evaluateGitPush('git push origin main', dir);
    assert.deepStrictEqual(result, { allow: true });
  });
});
