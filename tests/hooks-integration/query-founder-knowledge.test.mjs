// Tests for scripts/query-founder-knowledge.mjs, promoted from a zero-test PROTOTYPE to the
// Context Engine's core in the AI Engineering Operating System build. It had real dogfood
// evidence behind it (a 4-session run proving a cold session halts on a DO NOT SHIP verdict read
// back from --summary alone -- docs/status/PROJECT.md's decisions log) but no automated coverage
// at all before this file. These tests lock in that behavior mechanically.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unify, query, summary } from '../../plugins/wingman/scripts/query-founder-knowledge.mjs';

function makeProject(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'wingman-context-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

function checkpointLine(obj) {
  return JSON.stringify(obj) + '\n';
}

test('a project with no .wingman/ at all unifies to an empty array, never throws', () => {
  const dir = makeProject({});
  try {
    assert.deepEqual(unify(dir), []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('unify collects checkpoints, decisions, tried, memory, traceability, and state', () => {
  const dir = makeProject({
    '.wingman/checkpoints.jsonl': checkpointLine({
      checkpoint_id: '2026-07-29-build', stage: 'build', bundle: 'build',
      bottom_line: 'GO', founder_decision: 'ship_it', next_stage: 'ship',
    }),
    '.wingman/memory/decisions.md': '- 2026-07-20: Chose SQLite over Postgres.\n- an undated bullet with no date prefix\n',
    '.wingman/memory/tried.md': '- 2026-07-21: Tried a heavier ORM, reverted.\n',
    '.wingman/memory/MEMORY.md': '- Stack: Node + SQLite.\n',
    '.wingman/traceability.json': JSON.stringify({ next_id: { DISC: 2, DEF: 1 } }),
    '.wingman/state.json': JSON.stringify({ current_stage: 'ship', updated_at: '2026-07-29T00:00:00Z', active_department_leads: ['dept-devops'] }),
  });
  try {
    const all = unify(dir);
    const bySource = Object.fromEntries(
      ['checkpoints', 'decisions', 'tried', 'memory', 'traceability', 'state'].map((s) => [s, all.filter((r) => r.source === s)]),
    );
    assert.equal(bySource.checkpoints.length, 1);
    assert.equal(bySource.checkpoints[0].bottom_line, 'GO');
    assert.equal(bySource.decisions.length, 2, 'both the dated and undated bullet must surface');
    assert.equal(bySource.decisions[0].date, '2026-07-20');
    assert.equal(bySource.decisions[1].date, null, 'a line with no date prefix is undated, not dropped');
    assert.equal(bySource.tried.length, 1);
    assert.equal(bySource.memory.length, 1);
    assert.equal(bySource.traceability.length, 2, 'one row per prefix in traceability.json');
    assert.match(bySource.traceability.find((r) => r.text.startsWith('DISC')).text, /1 minted/);
    assert.equal(bySource.state.length, 1);
    assert.match(bySource.state[0].text, /current_stage=ship/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a malformed JSON file is skipped, not thrown', () => {
  const dir = makeProject({ '.wingman/state.json': '{ not valid json' });
  try {
    assert.doesNotThrow(() => unify(dir));
    assert.equal(unify(dir).some((r) => r.source === 'state'), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('query filters by source, stage, verdict, and since, and sorts chronologically', () => {
  const dir = makeProject({
    '.wingman/checkpoints.jsonl':
      checkpointLine({ checkpoint_id: '2026-07-10-define', stage: 'define', bottom_line: 'GO' }) +
      checkpointLine({ checkpoint_id: '2026-07-20-build', stage: 'build', bottom_line: 'DO NOT SHIP' }),
    '.wingman/memory/decisions.md': '- 2026-07-15: An unrelated decision.\n',
  });
  try {
    const onlyCheckpoints = query(dir, { source: 'checkpoints' });
    assert.equal(onlyCheckpoints.length, 2);
    assert.deepEqual(onlyCheckpoints.map((r) => r.date), ['2026-07-10', '2026-07-20'], 'chronological order');

    const byStage = query(dir, { stage: 'build' });
    assert.equal(byStage.length, 1);
    assert.equal(byStage[0].bottom_line, 'DO NOT SHIP');

    const byVerdict = query(dir, { verdict: 'DO NOT SHIP' });
    assert.equal(byVerdict.length, 1);
    assert.equal(byVerdict[0].stage, 'build');

    const since = query(dir, { since: '2026-07-16' });
    assert.equal(since.length, 1, 'only the build checkpoint is on or after the since date');
    assert.equal(since[0].stage, 'build');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// The real dogfood claim this promotes: a fresh "session" reading only --summary's output must
// see a blocking verdict and halt, per docs/status/PROJECT.md's 4-session dogfood run.
test('summary surfaces a blocking DO NOT SHIP verdict as the last checkpoint', () => {
  const dir = makeProject({
    '.wingman/checkpoints.jsonl':
      checkpointLine({ checkpoint_id: '2026-07-10-build', stage: 'build', bottom_line: 'GO', next_stage: 'ship' }) +
      checkpointLine({
        checkpoint_id: '2026-07-20-ship', stage: 'ship', bottom_line: 'DO NOT SHIP',
        founder_notes: 'CISO flagged missing rate-limiting', next_stage: 'ship',
      }),
    '.wingman/state.json': JSON.stringify({ current_stage: 'ship', updated_at: '2026-07-20T00:00:00Z' }),
  });
  try {
    const s = summary(dir);
    assert.equal(s.has_wingman_state, true);
    assert.equal(s.last_checkpoint.bottom_line, 'DO NOT SHIP');
    assert.equal(s.last_checkpoint.stage, 'ship');
    // A cold session must be able to find the concrete blocker from founder_notes, not just the verdict.
    const shipCheckpoint = query(dir, { stage: 'ship' })[0];
    assert.match(shipCheckpoint.text, /missing rate-limiting/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('summary flags a state/checkpoint stage mismatch as a real drift signal', () => {
  const dir = makeProject({
    '.wingman/checkpoints.jsonl': checkpointLine({
      checkpoint_id: '2026-07-20-build', stage: 'build', bottom_line: 'GO', next_stage: 'ship',
    }),
    // state.json was never advanced after the checkpoint -- the exact drift this field exists to catch.
    '.wingman/state.json': JSON.stringify({ current_stage: 'build' }),
  });
  try {
    const s = summary(dir);
    assert.notEqual(s.state_stage_mismatch, null);
    assert.match(s.state_stage_mismatch, /current_stage="build"/);
    assert.match(s.state_stage_mismatch, /next_stage is "ship"/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('summary reports no mismatch when state.json genuinely matches the last checkpoint', () => {
  const dir = makeProject({
    '.wingman/checkpoints.jsonl': checkpointLine({
      checkpoint_id: '2026-07-20-build', stage: 'build', bottom_line: 'GO', next_stage: 'ship',
    }),
    '.wingman/state.json': JSON.stringify({ current_stage: 'ship' }),
  });
  try {
    assert.equal(summary(dir).state_stage_mismatch, null);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('summary on a project with no .wingman/ reports has_wingman_state false, never throws', () => {
  const dir = makeProject({});
  try {
    const s = summary(dir);
    assert.equal(s.has_wingman_state, false);
    assert.equal(s.total_entries, 0);
    assert.equal(s.last_checkpoint, null);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('recent_decisions in summary caps at the last 3, in order', () => {
  const dir = makeProject({
    '.wingman/memory/decisions.md':
      '- 2026-07-01: one\n- 2026-07-02: two\n- 2026-07-03: three\n- 2026-07-04: four\n',
  });
  try {
    const s = summary(dir);
    assert.equal(s.recent_decisions.length, 3);
    assert.deepEqual(s.recent_decisions.map((d) => d.date), ['2026-07-02', '2026-07-03', '2026-07-04']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
