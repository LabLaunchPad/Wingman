/**
 * session-start.mjs + pre-compact-guard.mjs + stop-loop.mjs (Codex CLI adapter) Unit Tests
 *
 * All three ports rest on a 2026-07-25 fetch of https://learn.chatgpt.com/docs/hooks confirming
 * SessionStart, PreCompact, and Stop are real, documented Codex CLI hook events -- resolving an
 * earlier "no confirmed lifecycle-hook analog" state this adapter's README used to carry for these
 * three (compare ../../opencode/SESSION-LIFECYCLE-FINDINGS.md, where the equivalent OpenCode
 * investigation left stop-loop's port genuinely UNCLEAR after real live testing; Codex's situation
 * is different -- a documented event exists, it just hasn't been live-tested here, no configured
 * model provider in this sandbox). See each adapter file's own header comment for the specific
 * field-name citations and the genuine gaps disclosed (no `cwd` documented for PreCompact/Stop, no
 * tool-call-history field documented for Stop).
 *
 * These tests cover each file's pure, filesystem/clock-independent logic only.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { advanceSessionState, buildSummaryMessage } from '../../plugins/wingman/references/harness-adapters/codex-cli/.codex/hooks/session-start.mjs';
import { countRelevantChanges } from '../../plugins/wingman/references/harness-adapters/codex-cli/.codex/hooks/pre-compact-guard.mjs';
import { evaluate } from '../../plugins/wingman/references/harness-adapters/codex-cli/.codex/hooks/stop-loop.mjs';

describe('Codex CLI session-start.mjs advanceSessionState()', () => {
  it('starts session #1 with no previous summary on a fresh state', () => {
    const fresh = { sessionCount: 0, lastSessionId: null, lastSessionEnded: null, totalToolCalls: 0, sessions: [] };
    const { updated, previousSummary } = advanceSessionState(fresh, 1000);
    assert.strictEqual(updated.sessionCount, 1);
    assert.strictEqual(previousSummary, null);
    assert.strictEqual(updated.sessions.length, 1);
  });

  it('summarizes the previous session on the second call', () => {
    const fresh = { sessionCount: 0, lastSessionId: null, lastSessionEnded: null, totalToolCalls: 0, sessions: [] };
    const first = advanceSessionState(fresh, 1000).updated;
    first.sessions[0].toolCalls = 12;
    first.sessions[0].endedAt = '2026-07-25T00:00:00.000Z';
    const { updated, previousSummary } = advanceSessionState(first, 2000);
    assert.strictEqual(updated.sessionCount, 2);
    assert.strictEqual(previousSummary.toolCalls, 12);
    assert.strictEqual(previousSummary.endedAt, '2026-07-25T00:00:00.000Z');
  });

  it('caps the rolling session log at 20 entries', () => {
    let state = { sessionCount: 0, lastSessionId: null, lastSessionEnded: null, totalToolCalls: 0, sessions: [] };
    for (let i = 0; i < 25; i++) {
      state = advanceSessionState(state, 1000 + i).updated;
    }
    assert.strictEqual(state.sessions.length, 20);
    assert.strictEqual(state.sessionCount, 25);
  });
});

describe('Codex CLI session-start.mjs buildSummaryMessage()', () => {
  it('mentions the session number with no previous summary', () => {
    const msg = buildSummaryMessage({ sessionCount: 1 }, null);
    assert.match(msg, /Wingman session #1 started\./);
  });

  it('appends warning count when the previous session had warnings', () => {
    const msg = buildSummaryMessage({ sessionCount: 2 }, { sessionId: 's1', endedAt: 'x', toolCalls: 5, warnings: 2 });
    assert.match(msg, /5 tool call\(s\) and 2 warning\(s\)/);
  });

  it('omits the warning clause when there were zero warnings', () => {
    const msg = buildSummaryMessage({ sessionCount: 2 }, { sessionId: 's1', endedAt: 'x', toolCalls: 5, warnings: 0 });
    assert.doesNotMatch(msg, /warning/);
  });
});

describe('Codex CLI pre-compact-guard.mjs countRelevantChanges()', () => {
  it('returns 0 for an empty porcelain output', () => {
    assert.strictEqual(countRelevantChanges(''), 0);
  });

  it('counts real project file changes', () => {
    const output = ' M src/app.js\n?? new-file.js\n';
    assert.strictEqual(countRelevantChanges(output), 2);
  });

  it('excludes .wingman/ bookkeeping files from the count', () => {
    const output = ' M .wingman/state.json\n M .wingman/checkpoints.jsonl\n M src/app.js\n';
    assert.strictEqual(countRelevantChanges(output), 1);
  });

  it('returns 0 when only .wingman/ files changed', () => {
    const output = ' M .wingman/state.json\n';
    assert.strictEqual(countRelevantChanges(output), 0);
  });
});

describe('Codex CLI stop-loop.mjs evaluate()', () => {
  it('stops immediately when the loop is disabled', () => {
    const result = evaluate({ enabled: false }, 'done', 0, {});
    assert.strictEqual(result.decision, 'stop');
    assert.match(result.reason, /disabled/);
  });

  it('stops when no completion promise is configured', () => {
    const result = evaluate({ enabled: true }, 'done', 0, {});
    assert.strictEqual(result.decision, 'stop');
    assert.match(result.reason, /no completion promise/);
  });

  it('continues when the promise has not yet been met', () => {
    const result = evaluate({ enabled: true, completionPromise: 'DONE' }, 'still working', 0, {});
    assert.strictEqual(result.decision, 'continue');
  });

  it('stops once the promise text appears in the last assistant message', () => {
    const result = evaluate({ enabled: true, completionPromise: 'DONE' }, 'all set, DONE', 3, {});
    assert.strictEqual(result.decision, 'stop');
    assert.match(result.reason, /completion promise met/);
  });

  it('does not stop on a claimed promise if verifyCommand is set but verification failed', () => {
    const result = evaluate(
      { enabled: true, completionPromise: 'DONE', verifyCommand: 'npm test' },
      'all set, DONE',
      3,
      { verifyPassed: false }
    );
    assert.strictEqual(result.decision, 'continue');
  });

  it('stops on max iterations reached', () => {
    const result = evaluate({ enabled: true, completionPromise: 'DONE', maxIterations: 5 }, 'still working', 5, {});
    assert.strictEqual(result.decision, 'stop');
    assert.match(result.reason, /max iterations/);
  });

  it('stops on wall-clock budget exhaustion', () => {
    const result = evaluate(
      { enabled: true, completionPromise: 'DONE', maxWallClockMinutes: 10 },
      'still working',
      1,
      { elapsedMinutes: 12 }
    );
    assert.strictEqual(result.decision, 'stop');
    assert.match(result.reason, /wall-clock budget/);
  });

  it('stops on a detected stall (identical repeated tool signatures)', () => {
    const result = evaluate(
      { enabled: true, completionPromise: 'DONE' },
      'still working',
      1,
      { recentToolSignatures: ['Bash:{}', 'Bash:{}', 'Bash:{}'] }
    );
    assert.strictEqual(result.decision, 'stop');
    assert.match(result.reason, /no progress detected/);
  });

  it('does not falsely stall on a non-identical recent signature window', () => {
    const result = evaluate(
      { enabled: true, completionPromise: 'DONE' },
      'still working',
      1,
      { recentToolSignatures: ['Bash:{}', 'Read:{}', 'Bash:{}'] }
    );
    assert.strictEqual(result.decision, 'continue');
  });

  it('never stalls when Codex Stop wiring passes an empty recentToolSignatures (documented gap)', () => {
    // The Codex CLI port's CLI entrypoint always passes [] here, since Stop's documented input
    // fields include no tool-call history -- this asserts evaluate() degrades safely (never
    // stops on stall) rather than throwing or misbehaving on an empty array.
    const result = evaluate({ enabled: true, completionPromise: 'DONE' }, 'still working', 1, { recentToolSignatures: [] });
    assert.strictEqual(result.decision, 'continue');
  });
});
