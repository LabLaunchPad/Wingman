// Unit tests for the pure logic ported from Wingman's 3 remaining Claude
// Code lifecycle hooks (pre-compact-guard.mjs, session-start.mjs,
// stop-loop.mjs) into their OpenCode adapter equivalents. See
// plugins/wingman/references/harness-adapters/opencode/SESSION-LIFECYCLE-FINDINGS.md
// for which of these pure functions have a confirmed real OpenCode wiring
// and which don't -- this file tests the logic either way, since porting the
// logic and confirming the wiring are separate claims.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { countRelevantChanges } from '../../plugins/wingman/references/harness-adapters/opencode/.opencode/plugin/pre-compact-guard.js';
import { buildSessionUpdate } from '../../plugins/wingman/references/harness-adapters/opencode/.opencode/plugin/session-start.js';
// 2026-07-25 update: these pure functions moved to lib/stop-loop-logic.js -- stop-loop.js itself is
// now a real, WIRED plugin (confirmed working under `opencode serve`; see its own header comment).
// They moved out of the top-level, auto-discovered file because OpenCode's plugin loader invokes
// EVERY named export of a discovered file as if it were its own plugin factory, and calling
// `loadLoopConfig` that way (with a plugin-context object instead of a real path) returned `null` --
// a correct, intentional value for its real contract, but fatal to the loader, which then crashed
// trying to read `.config`/`.event` off that `null`. See stop-loop.js's and lib/stop-loop-logic.js's
// own header comments for the full write-up; this import path change is the direct consequence.
import {
  evaluate,
  extractAssistantText,
  loadLoopConfig,
  extractLoopSignals,
} from '../../plugins/wingman/references/harness-adapters/opencode/.opencode/plugin/lib/stop-loop-logic.js';

// --- countRelevantChanges (pre-compact-guard.js) ---

test('countRelevantChanges: empty porcelain output -> 0', () => {
  assert.equal(countRelevantChanges(''), 0);
});

test('countRelevantChanges: counts real changes, excludes .wingman/ files', () => {
  const porcelain = [
    ' M src/index.js',
    '?? .wingman/state.json',
    '?? .wingman/checkpoints.jsonl',
    ' M docs/README.md',
    '',
  ].join('\n');
  assert.equal(countRelevantChanges(porcelain), 2);
});

test('countRelevantChanges: all changes under .wingman/ -> 0', () => {
  const porcelain = ['?? .wingman/state.json', ' M .wingman/session-state.json'].join('\n');
  assert.equal(countRelevantChanges(porcelain), 0);
});

test('countRelevantChanges: blank lines are ignored', () => {
  const porcelain = '\n\n M a.txt\n\n';
  assert.equal(countRelevantChanges(porcelain), 1);
});

// --- buildSessionUpdate (session-start.js) ---

test('buildSessionUpdate: first-ever session has no previous summary', () => {
  const fresh = { sessionCount: 0, lastSessionId: null, totalToolCalls: 0, sessions: [] };
  const { updatedSessionState, previousSummary } = buildSessionUpdate(fresh, 'session-1', '2026-01-01T00:00:00.000Z');
  assert.equal(previousSummary, null);
  assert.equal(updatedSessionState.sessionCount, 1);
  assert.equal(updatedSessionState.lastSessionId, 'session-1');
  assert.equal(updatedSessionState.sessions.length, 1);
  assert.equal(updatedSessionState.sessions[0].sessionId, 'session-1');
  assert.equal(updatedSessionState.sessions[0].startedAt, '2026-01-01T00:00:00.000Z');
});

test('buildSessionUpdate: second session reports a summary of the first', () => {
  const prior = {
    sessionCount: 1,
    lastSessionId: 'session-1',
    totalToolCalls: 5,
    sessions: [{ sessionId: 'session-1', startedAt: 't0', endedAt: 't1', toolCalls: 5, warnings: 2 }],
  };
  const { updatedSessionState, previousSummary } = buildSessionUpdate(prior, 'session-2', '2026-01-02T00:00:00.000Z');
  assert.deepEqual(previousSummary, { sessionId: 'session-1', endedAt: 't1', toolCalls: 5, warnings: 2 });
  assert.equal(updatedSessionState.sessionCount, 2);
  assert.equal(updatedSessionState.sessions.length, 2);
  assert.equal(updatedSessionState.totalToolCalls, 5);
});

test('buildSessionUpdate: rolling log keeps only the last 20 sessions', () => {
  const sessions = Array.from({ length: 20 }, (_, i) => ({
    sessionId: `session-${i}`,
    startedAt: `t${i}`,
    endedAt: `t${i}-end`,
    toolCalls: i,
    warnings: 0,
  }));
  const prior = { sessionCount: 20, lastSessionId: 'session-19', totalToolCalls: 190, sessions };
  const { updatedSessionState } = buildSessionUpdate(prior, 'session-20', '2026-01-21T00:00:00.000Z');
  assert.equal(updatedSessionState.sessions.length, 20);
  assert.equal(updatedSessionState.sessions[0].sessionId, 'session-1'); // session-0 dropped
  assert.equal(updatedSessionState.sessions[19].sessionId, 'session-20');
});

// --- evaluate (stop-loop.js, unwired but ported) ---

test('evaluate: loop disabled by default -> stop', () => {
  assert.deepEqual(evaluate(null, 'anything', 0), { decision: 'stop', reason: 'loop disabled' });
  assert.deepEqual(evaluate({ enabled: false }, 'anything', 0), { decision: 'stop', reason: 'loop disabled' });
});

test('evaluate: enabled but no completionPromise -> stop', () => {
  const result = evaluate({ enabled: true }, 'anything', 0);
  assert.equal(result.decision, 'stop');
  assert.equal(result.reason, 'no completion promise configured');
});

test('evaluate: completion promise met, no verifyCommand -> stop', () => {
  const config = { enabled: true, completionPromise: 'DONE' };
  const result = evaluate(config, 'All finished. DONE.', 3);
  assert.equal(result.decision, 'stop');
  assert.equal(result.reason, 'completion promise met');
});

test('evaluate: completion promise not yet met, under iteration cap -> continue', () => {
  const config = { enabled: true, completionPromise: 'DONE', maxIterations: 10 };
  const result = evaluate(config, 'Still working on it.', 3);
  assert.deepEqual(result, { decision: 'continue', reason: null });
});

test('evaluate: iteration cap reached -> stop', () => {
  const config = { enabled: true, completionPromise: 'DONE', maxIterations: 5 };
  const result = evaluate(config, 'Still working.', 5);
  assert.equal(result.decision, 'stop');
  assert.match(result.reason, /max iterations reached \(5\/5\)/);
});

test('evaluate: promise claimed but verifyCommand not yet passed -> continue (bounded by caps)', () => {
  const config = { enabled: true, completionPromise: 'DONE', verifyCommand: 'npm test', maxIterations: 10 };
  const result = evaluate(config, 'DONE, I promise!', 2, { verifyPassed: false });
  assert.deepEqual(result, { decision: 'continue', reason: null });
});

test('evaluate: promise claimed and verifyCommand passed -> stop', () => {
  const config = { enabled: true, completionPromise: 'DONE', verifyCommand: 'npm test' };
  const result = evaluate(config, 'DONE, I promise!', 2, { verifyPassed: true });
  assert.equal(result.decision, 'stop');
  assert.equal(result.reason, 'completion promise met');
});

test('evaluate: wall-clock budget exceeded -> stop', () => {
  const config = { enabled: true, completionPromise: 'DONE', maxWallClockMinutes: 10 };
  const result = evaluate(config, 'Still working.', 1, { elapsedMinutes: 12 });
  assert.equal(result.decision, 'stop');
  assert.match(result.reason, /wall-clock budget reached/);
});

test('evaluate: stall detected (same tool repeated) -> stop', () => {
  const config = { enabled: true, completionPromise: 'DONE' };
  const result = evaluate(config, 'Still working.', 1, {
    recentToolSignatures: ['bash:{"command":"ls"}', 'bash:{"command":"ls"}', 'bash:{"command":"ls"}'],
  });
  assert.equal(result.decision, 'stop');
  assert.match(result.reason, /no progress detected/);
});

test('evaluate: stallThreshold 0 disables stall detection', () => {
  const config = { enabled: true, completionPromise: 'DONE', stallThreshold: 0 };
  const result = evaluate(config, 'Still working.', 1, {
    recentToolSignatures: ['bash:{"command":"ls"}', 'bash:{"command":"ls"}', 'bash:{"command":"ls"}'],
  });
  assert.deepEqual(result, { decision: 'continue', reason: null });
});

// --- extractAssistantText (stop-loop.js) ---

test('extractAssistantText: plain string content', () => {
  assert.equal(extractAssistantText('hello'), 'hello');
});

test('extractAssistantText: array of content blocks, text blocks joined', () => {
  const content = [
    { type: 'text', text: 'part one. ' },
    { type: 'tool_use', name: 'bash', input: {} },
    { type: 'text', text: 'part two.' },
  ];
  assert.equal(extractAssistantText(content), 'part one. part two.');
});

test('extractAssistantText: non-string, non-array -> empty string', () => {
  assert.equal(extractAssistantText(undefined), '');
  assert.equal(extractAssistantText(null), '');
  assert.equal(extractAssistantText(42), '');
});

// --- loadLoopConfig (lib/stop-loop-logic.js) ---

test('loadLoopConfig: missing file -> null', () => {
  assert.equal(loadLoopConfig('/nonexistent/path/loop.json'), null);
});

test('loadLoopConfig: non-string argument -> null, does not throw (the confirmed loader-crash guard)', () => {
  // Real, live-confirmed finding (see stop-loop.js's own header comment): OpenCode's plugin loader
  // auto-discovers every top-level file under .opencode/plugin/ and invokes every named export as
  // if it were its own plugin factory, i.e. with a plugin-context OBJECT as the sole argument, not a
  // string path. existsSync() would throw synchronously on a non-string argument if this function
  // didn't guard against it -- this is exactly why the pure logic moved to lib/ (not auto-discovered)
  // AND why this function stays defensive regardless.
  assert.equal(loadLoopConfig({ client: {}, directory: '/tmp' }), null);
  assert.equal(loadLoopConfig(undefined), null);
  assert.equal(loadLoopConfig(42), null);
});

// --- extractLoopSignals (lib/stop-loop-logic.js) -- new in this pass, reads OpenCode's real
// GET /session/{id}/message shape (`[{ info: {...}, parts: [...] }]`) instead of a Claude Code
// JSONL transcript. ---

test('extractLoopSignals: empty/non-array input -> no signals', () => {
  assert.deepEqual(extractLoopSignals(undefined, 3), {
    lastAssistantId: null,
    lastAssistantText: '',
    recentToolSignatures: [],
  });
  assert.deepEqual(extractLoopSignals([], 3), {
    lastAssistantId: null,
    lastAssistantText: '',
    recentToolSignatures: [],
  });
});

test('extractLoopSignals: finds the LAST assistant message with real text, ignores user messages', () => {
  const messages = [
    { info: { role: 'user', id: 'msg_u1' }, parts: [{ type: 'text', text: 'do the thing' }] },
    { info: { role: 'assistant', id: 'msg_a1' }, parts: [{ type: 'text', text: 'first reply' }] },
    { info: { role: 'user', id: 'msg_u2' }, parts: [{ type: 'text', text: 'keep going' }] },
    { info: { role: 'assistant', id: 'msg_a2' }, parts: [{ type: 'text', text: 'second reply, DONE' }] },
  ];
  const result = extractLoopSignals(messages, 3);
  assert.equal(result.lastAssistantId, 'msg_a2');
  assert.equal(result.lastAssistantText, 'second reply, DONE');
});

test('extractLoopSignals: assistant messages with no text part (tool-only steps) do not overwrite the last real text', () => {
  const messages = [
    { info: { role: 'assistant', id: 'msg_a1' }, parts: [{ type: 'text', text: 'real reply' }] },
    { info: { role: 'assistant', id: 'msg_a2' }, parts: [{ type: 'tool', tool: 'bash', state: { input: { command: 'ls' } } }] },
  ];
  const result = extractLoopSignals(messages, 3);
  // msg_a2 has no text part, so the last real text/id stay at msg_a1's.
  assert.equal(result.lastAssistantId, 'msg_a1');
  assert.equal(result.lastAssistantText, 'real reply');
});

test('extractLoopSignals: collects tool-call signatures across assistant messages, capped at stallThreshold', () => {
  const messages = [
    { info: { role: 'assistant', id: 'a1' }, parts: [{ type: 'tool', tool: 'bash', state: { input: { command: 'ls' } } }] },
    { info: { role: 'assistant', id: 'a2' }, parts: [{ type: 'tool', tool: 'bash', state: { input: { command: 'ls' } } }] },
    { info: { role: 'assistant', id: 'a3' }, parts: [{ type: 'tool', tool: 'bash', state: { input: { command: 'ls' } } }] },
  ];
  const result = extractLoopSignals(messages, 2);
  assert.equal(result.recentToolSignatures.length, 2); // capped, not 3
  assert.equal(result.recentToolSignatures[0], 'bash:{"command":"ls"}');
});

test('extractLoopSignals: stallThreshold 0 disables tool-signature collection', () => {
  const messages = [
    { info: { role: 'assistant', id: 'a1' }, parts: [{ type: 'tool', tool: 'bash', state: { input: {} } }] },
  ];
  const result = extractLoopSignals(messages, 0);
  assert.deepEqual(result.recentToolSignatures, []);
});
