/**
 * boardroom-verdict-tool.js (OpenCode adapter) unit tests
 *
 * Real, in-process verification of the pure functions behind the new `wingman_boardroom_verdict`
 * custom tool (readCheckpoints/findLatestCheckpoint/formatVerdict). Does NOT re-test the OpenCode
 * `tool` registration/dispatch itself here (confirmed via a real live `opencode run -m
 * opencode/deepseek-v4-flash-free` session against a fixture `.wingman/checkpoints.jsonl` -- the
 * model's own tool call and final summary are quoted in this file's header comment and the adapter
 * README's dated section).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  readCheckpoints,
  findLatestCheckpoint,
  formatVerdict,
} from '../../plugins/wingman/references/harness-adapters/opencode/.opencode/plugin/boardroom-verdict-tool.js';

function fixtureDir() {
  return mkdtempSync(join(tmpdir(), 'wingman-boardroom-verdict-'));
}

function writeCheckpoints(dir, entries) {
  mkdirSync(join(dir, '.wingman'), { recursive: true });
  writeFileSync(join(dir, '.wingman', 'checkpoints.jsonl'), entries.map((e) => JSON.stringify(e)).join('\n') + '\n');
}

test('readCheckpoints: missing file -> empty array, no throw', () => {
  const dir = fixtureDir();
  try {
    assert.deepEqual(readCheckpoints(dir), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('readCheckpoints: returns all entries when no stage filter given', () => {
  const dir = fixtureDir();
  try {
    writeCheckpoints(dir, [
      { stage: 'define', bottom_line: 'GO', seats: [] },
      { stage: 'build', bottom_line: 'DO NOT SHIP', seats: [{ seat: 'CISO', verdict: 'NO_GO' }] },
    ]);
    const entries = readCheckpoints(dir);
    assert.equal(entries.length, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('readCheckpoints: filters by stage', () => {
  const dir = fixtureDir();
  try {
    writeCheckpoints(dir, [
      { stage: 'define', bottom_line: 'GO', seats: [] },
      { stage: 'build', bottom_line: 'DO NOT SHIP', seats: [] },
    ]);
    const entries = readCheckpoints(dir, 'build');
    assert.equal(entries.length, 1);
    assert.equal(entries[0].stage, 'build');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('readCheckpoints: skips malformed JSON lines instead of throwing', () => {
  const dir = fixtureDir();
  try {
    mkdirSync(join(dir, '.wingman'), { recursive: true });
    writeFileSync(
      join(dir, '.wingman', 'checkpoints.jsonl'),
      '{"stage":"define","bottom_line":"GO","seats":[]}\nnot json\n{"stage":"build","bottom_line":"GO","seats":[]}\n'
    );
    const entries = readCheckpoints(dir);
    assert.equal(entries.length, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('findLatestCheckpoint: returns the LAST matching entry, not the first', () => {
  const dir = fixtureDir();
  try {
    writeCheckpoints(dir, [
      { stage: 'build', bottom_line: 'GO', seats: [] },
      { stage: 'build', bottom_line: 'DO NOT SHIP', seats: [{ seat: 'CISO', verdict: 'NO_GO' }] },
    ]);
    const latest = findLatestCheckpoint(dir, 'build');
    assert.equal(latest.bottom_line, 'DO NOT SHIP');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('findLatestCheckpoint: null when nothing matches', () => {
  const dir = fixtureDir();
  try {
    assert.equal(findLatestCheckpoint(dir), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('formatVerdict: no checkpoint -> found:false with a plain-language message', () => {
  const result = formatVerdict(null);
  assert.equal(result.found, false);
  assert.match(result.summary, /No Boardroom checkpoint/);
});

test('formatVerdict: DO NOT SHIP with a NO_GO seat surfaces the blocking seat by name', () => {
  const result = formatVerdict({
    stage: 'build',
    bottom_line: 'DO NOT SHIP',
    seats: [{ seat: 'CTO', verdict: 'GO' }, { seat: 'CISO', verdict: 'NO_GO' }],
  });
  assert.equal(result.found, true);
  assert.equal(result.bottomLine, 'DO NOT SHIP');
  assert.match(result.summary, /CISO recorded NO_GO/);
  assert.match(result.summary, /build stage/);
});

test('formatVerdict: GO_WITH_CONCERNS surfaces which seats raised concerns', () => {
  const result = formatVerdict({
    bottom_line: 'GO_WITH_CONCERNS',
    seats: [{ seat: 'CFO', verdict: 'GO_WITH_CONCERNS' }, { seat: 'CTO', verdict: 'GO' }],
  });
  assert.match(result.summary, /Concerns raised by: CFO/);
});

test('formatVerdict: clean GO with no seats recorded still produces a sensible summary', () => {
  const result = formatVerdict({ bottom_line: 'GO', seats: [] });
  assert.match(result.summary, /Bottom line: GO/);
  assert.match(result.summary, /No individual seat verdicts/);
});
