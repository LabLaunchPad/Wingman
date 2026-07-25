/**
 * wingman-gate.js (OpenCode adapter) Unit Tests
 *
 * Real, in-process verification of `evaluateCheckpoint`'s pure decision logic -- the part of the
 * OpenCode plugin that has zero OpenCode-specific dependency (plain string/regex checks over plan
 * text), confirmed independently testable per the file's own header comment.
 *
 * This does NOT test the plugin's OpenCode wiring (`tool.execute.before` matched against `plan_exit`)
 * -- a live investigation (`opencode debug agent plan`) found `plan_exit` is not a registered tool
 * in the agent's real `tools` list (only `invalid, question, bash, read, glob, grep, edit, write,
 * task, webfetch, todowrite, skill`); it appears only as a `permission` entry. That means the hook's
 * tool-name match likely never fires via the standard tool-call path in OpenCode v1.18.5 -- a real,
 * disclosed finding, not assumed. See the adapter's README for the full account. These tests exist
 * so the one part that IS confirmed correct (the decision logic) has real regression coverage,
 * independent of whatever the eventual correct OpenCode wiring turns out to be.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateCheckpoint } from '../../plugins/wingman/references/harness-adapters/opencode/.opencode/plugin/wingman-gate.js';

describe('wingman-gate.js evaluateCheckpoint', () => {
  it('allows when nothing Wingman-related has been touched (no plan sources)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gate-test-'));
    const result = evaluateCheckpoint(null, dir);
    assert.deepStrictEqual(result, { allow: true });
  });

  it('blocks an inline plan with no Boardroom checkpoint marker at all', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gate-test-'));
    const result = evaluateCheckpoint('just some random plan text with no marker', dir);
    assert.strictEqual(result.allow, false);
    assert.match(result.reason, /hasn't been through a Boardroom checkpoint/);
  });

  it('blocks a marked checkpoint whose bottom line is DO NOT SHIP', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gate-test-'));
    const text = [
      '## Wingman Boardroom Checkpoint',
      'Bottom line: DO NOT SHIP',
      'Founder decision: still reviewing',
    ].join('\n');
    const result = evaluateCheckpoint(text, dir);
    assert.strictEqual(result.allow, false);
    assert.match(result.reason, /DO NOT SHIP/);
  });

  it('blocks a marked checkpoint missing required plan sections', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gate-test-'));
    const text = ['## Wingman Boardroom Checkpoint', 'Founder decision: ship it'].join('\n');
    const result = evaluateCheckpoint(text, dir);
    assert.strictEqual(result.allow, false);
  });

  it('allows a fully approved checkpoint with all required sections and "ship it"', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gate-test-'));
    const text = [
      '## Wingman Boardroom Checkpoint',
      '## Executive Summary',
      'x',
      '## Current State',
      'x',
      '## Problem Statement',
      'x',
      '## Solution Approach',
      'x',
      '## Success Criteria',
      'x',
      '## Timeline',
      'x',
      '## Risks',
      'x',
      'Founder decision: ship it',
    ].join('\n');
    const result = evaluateCheckpoint(text, dir);
    assert.deepStrictEqual(result, { allow: true });
  });
});
