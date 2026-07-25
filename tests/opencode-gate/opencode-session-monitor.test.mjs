/**
 * session-monitor.js (OpenCode adapter) Unit Tests
 *
 * Real, in-process verification of the pure state-update logic ported from
 * plugins/wingman/hooks/context-monitor.mjs and plugins/wingman/hooks/session-health.mjs into
 * the OpenCode plugin at
 * plugins/wingman/references/harness-adapters/opencode/.opencode/plugin/session-monitor.js.
 *
 * Same discipline as tests/opencode-gate/opencode-gate.test.mjs: test the pure functions
 * (updateContextState, updateHealthState, isInsideProject) independent of any live OpenCode
 * session or the `tool.execute.after` wiring, which was instead confirmed by a real live test
 * (see this session's report / the plugin file's own header comment for the live-test findings
 * and args-shape investigation).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  updateContextState,
  updateHealthState,
  defaultContextState,
  defaultHealthState,
  isInsideProject,
  extractEditedPaths,
  getConfig,
} from '../../plugins/wingman/references/harness-adapters/opencode/.opencode/plugin/session-monitor.js';

const {
  CONTEXT_WARNING_THRESHOLD,
  CONTEXT_CRITICAL_THRESHOLD,
  ESTIMATED_CONTEXT_CHARS,
  HEALTH_YELLOW_THRESHOLD,
  HEALTH_RED_THRESHOLD,
} = getConfig();

describe('isInsideProject', () => {
  it('treats a path under the project root as inside', () => {
    assert.strictEqual(isInsideProject('/home/user/proj/src/x.js', '/home/user/proj'), true);
  });

  it('treats a path equal to the project root as inside', () => {
    assert.strictEqual(isInsideProject('/home/user/proj', '/home/user/proj'), true);
  });

  it('treats a sibling or unrelated path as outside', () => {
    assert.strictEqual(isInsideProject('/home/user/other/x.js', '/home/user/proj'), false);
    assert.strictEqual(isInsideProject('/etc/passwd', '/home/user/proj'), false);
  });
});

describe('extractEditedPaths', () => {
  it('extracts filePath (camelCase) for write/edit tools', () => {
    assert.deepStrictEqual(extractEditedPaths('write', { filePath: '/a/b.txt' }), ['/a/b.txt']);
    assert.deepStrictEqual(extractEditedPaths('edit', { filePath: '/a/b.txt' }), ['/a/b.txt']);
  });

  it('ignores non write/edit tools and missing filePath', () => {
    assert.deepStrictEqual(extractEditedPaths('read', { filePath: '/a/b.txt' }), []);
    assert.deepStrictEqual(extractEditedPaths('write', {}), []);
  });
});

describe('updateContextState', () => {
  it('accumulates payload byte count and call count across calls', () => {
    const cwd = '/home/user/proj';
    let state = defaultContextState();
    let result = updateContextState(state, {
      sessionId: 'ses_1',
      toolName: 'bash',
      args: { command: 'echo hi' },
      cwd,
    });
    assert.strictEqual(result.state.callCount, 1);
    assert.ok(result.state.totalPayloadBytes > 0);
    assert.strictEqual(result.state.sessionId, 'ses_1');

    const afterFirst = result.state.totalPayloadBytes;
    result = updateContextState(result.state, {
      sessionId: 'ses_1',
      toolName: 'bash',
      args: { command: 'echo hi again' },
      cwd,
    });
    assert.strictEqual(result.state.callCount, 2);
    assert.ok(result.state.totalPayloadBytes > afterFirst);
    // sessionId should not be overwritten once set
    assert.strictEqual(result.state.sessionId, 'ses_1');
  });

  it('detects scope creep for a write path outside the project root', () => {
    const cwd = '/home/user/proj';
    let state = defaultContextState();
    const result = updateContextState(state, {
      sessionId: 'ses_1',
      toolName: 'write',
      args: { filePath: '/etc/outside.txt', content: 'x' },
      cwd,
    });
    assert.strictEqual(result.state.scopeCreep.filesOutsideProject.length, 1);
    assert.strictEqual(result.state.scopeCreep.filesOutsideProject[0].path, '/etc/outside.txt');
    assert.strictEqual(result.state.scopeCreep.warningCount, 1);
    assert.ok(result.messages.some((m) => m.includes('Scope Creep')));
  });

  it('does not flag a write path inside the project root', () => {
    const cwd = '/home/user/proj';
    const state = defaultContextState();
    const result = updateContextState(state, {
      sessionId: 'ses_1',
      toolName: 'write',
      args: { filePath: '/home/user/proj/src/x.js', content: 'x' },
      cwd,
    });
    assert.strictEqual(result.state.scopeCreep.filesOutsideProject.length, 0);
    assert.ok(!result.messages.some((m) => m.includes('Scope Creep')));
  });

  it('does not double-count the same outside path seen twice', () => {
    const cwd = '/home/user/proj';
    let state = defaultContextState();
    let result = updateContextState(state, {
      sessionId: 'ses_1',
      toolName: 'write',
      args: { filePath: '/etc/outside.txt', content: 'x' },
      cwd,
    });
    result = updateContextState(result.state, {
      sessionId: 'ses_1',
      toolName: 'write',
      args: { filePath: '/etc/outside.txt', content: 'y' },
      cwd,
    });
    assert.strictEqual(result.state.scopeCreep.filesOutsideProject.length, 1);
    assert.strictEqual(result.state.scopeCreep.warningCount, 1);
  });

  it('emits a WARNING message once remaining context crosses 35%', () => {
    const cwd = '/home/user/proj';
    // remainingPct <= 0.35  =>  usagePct >= 0.65
    const bytesNeeded = Math.ceil(ESTIMATED_CONTEXT_CHARS * 0.65);
    const state = defaultContextState();
    const result = updateContextState(state, {
      sessionId: 'ses_1',
      toolName: 'bash',
      args: { command: 'x'.repeat(bytesNeeded) },
      cwd,
    });
    const remaining = 1 - result.state.estimatedContextUsagePct;
    assert.ok(remaining <= CONTEXT_WARNING_THRESHOLD);
    assert.ok(remaining > CONTEXT_CRITICAL_THRESHOLD);
    assert.strictEqual(result.state.warnings.at(-1).level, 'WARNING');
    assert.ok(result.messages.some((m) => m.includes('WARNING')));
  });

  it('emits a CRITICAL message once remaining context crosses 25%', () => {
    const cwd = '/home/user/proj';
    // remainingPct <= 0.25  =>  usagePct >= 0.75
    const bytesNeeded = Math.ceil(ESTIMATED_CONTEXT_CHARS * 0.8);
    const state = defaultContextState();
    const result = updateContextState(state, {
      sessionId: 'ses_1',
      toolName: 'bash',
      args: { command: 'x'.repeat(bytesNeeded) },
      cwd,
    });
    const remaining = 1 - result.state.estimatedContextUsagePct;
    assert.ok(remaining <= CONTEXT_CRITICAL_THRESHOLD);
    assert.strictEqual(result.state.warnings.at(-1).level, 'CRITICAL');
    assert.ok(result.messages.some((m) => m.includes('CRITICAL')));
  });

  it('emits no warning while well under threshold', () => {
    const cwd = '/home/user/proj';
    const state = defaultContextState();
    const result = updateContextState(state, {
      sessionId: 'ses_1',
      toolName: 'bash',
      args: { command: 'echo hi' },
      cwd,
    });
    assert.strictEqual(result.state.warnings.length, 0);
    assert.strictEqual(result.messages.length, 0);
  });
});

describe('updateHealthState', () => {
  it('accumulates tool call count across calls, keyed by session', () => {
    let state = defaultHealthState();
    let result = updateHealthState(state, { sessionId: 'ses_1' });
    assert.strictEqual(result.state.toolCallCount, 1);
    assert.strictEqual(result.state.sessionId, 'ses_1');
    result = updateHealthState(result.state, { sessionId: 'ses_1' });
    assert.strictEqual(result.state.toolCallCount, 2);
  });

  it('emits no warning below the YELLOW threshold', () => {
    let state = defaultHealthState();
    for (let i = 0; i < HEALTH_YELLOW_THRESHOLD - 1; i++) {
      state = updateHealthState(state, { sessionId: 'ses_1' }).state;
    }
    assert.strictEqual(state.toolCallCount, HEALTH_YELLOW_THRESHOLD - 1);
    assert.strictEqual(state.warnings.length, 0);
  });

  it('emits a YELLOW warning exactly at the 40-call threshold', () => {
    let state = defaultHealthState();
    let result;
    for (let i = 0; i < HEALTH_YELLOW_THRESHOLD; i++) {
      result = updateHealthState(state, { sessionId: 'ses_1' });
      state = result.state;
    }
    assert.strictEqual(state.toolCallCount, HEALTH_YELLOW_THRESHOLD);
    assert.strictEqual(state.warnings.at(-1).level, 'YELLOW');
    assert.strictEqual(state.yellowWarningCount, 1);
    assert.ok(result.messages.some((m) => m.includes('YELLOW')));
  });

  it('emits a RED warning exactly at the 60-call threshold', () => {
    let state = defaultHealthState();
    let result;
    for (let i = 0; i < HEALTH_RED_THRESHOLD; i++) {
      result = updateHealthState(state, { sessionId: 'ses_1' });
      state = result.state;
    }
    assert.strictEqual(state.toolCallCount, HEALTH_RED_THRESHOLD);
    assert.strictEqual(state.warnings.at(-1).level, 'RED');
    assert.strictEqual(state.redWarningCount, 1);
    assert.ok(result.messages.some((m) => m.includes('RED')));
  });
});
