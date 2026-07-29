// Tests for scripts/memory-tiers.mjs, the 7-tier Memory Engine (PR 5 of the AI Engineering
// Operating System build). Covers: path resolution for every tier (including the deliberate
// product===project collapse), narrowest-first read ordering, the mechanical secret rejection
// (reusing hooks/secret-guard.mjs's real pattern set), and the mechanical approval gate on
// global/org writes.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  TIERS,
  APPROVAL_REQUIRED_TIERS,
  tierDir,
  readTier,
  readAllTiers,
  writeTierEntry,
} from '../../plugins/wingman/scripts/memory-tiers.mjs';

function makeDirs() {
  const projectDir = mkdtempSync(join(tmpdir(), 'wingman-project-'));
  const fakeHome = mkdtempSync(join(tmpdir(), 'wingman-home-'));
  return { projectDir, fakeHome };
}

function cleanup(...dirs) {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
}

test('all 7 tiers are named exactly as the founder spec, no more no fewer', () => {
  assert.deepEqual(TIERS, ['global', 'org', 'product', 'project', 'feature', 'task', 'user']);
});

test('product and project resolve to the identical directory, deliberately', () => {
  const { projectDir, fakeHome } = makeDirs();
  try {
    assert.equal(
      tierDir('product', projectDir, { homeDir: fakeHome }),
      tierDir('project', projectDir, { homeDir: fakeHome }),
    );
  } finally { cleanup(projectDir, fakeHome); }
});

test('global and org resolve OUTSIDE the project directory entirely', () => {
  const { projectDir, fakeHome } = makeDirs();
  try {
    const globalDir = tierDir('global', projectDir, { homeDir: fakeHome });
    const orgDir = tierDir('org', projectDir, { homeDir: fakeHome, org: 'acme' });
    assert.ok(globalDir.startsWith(fakeHome), 'global must live under the home dir, not the project');
    assert.ok(!globalDir.startsWith(projectDir));
    assert.ok(orgDir.startsWith(fakeHome));
    assert.ok(!orgDir.startsWith(projectDir));
    assert.notEqual(globalDir, orgDir);
  } finally { cleanup(projectDir, fakeHome); }
});

test('feature/task/user/org tiers require their identifier, or throw', () => {
  const { projectDir, fakeHome } = makeDirs();
  try {
    assert.throws(() => tierDir('feature', projectDir, { homeDir: fakeHome }), /requires opts.feature/);
    assert.throws(() => tierDir('task', projectDir, { homeDir: fakeHome }), /requires opts.task/);
    assert.throws(() => tierDir('user', projectDir, { homeDir: fakeHome }), /requires opts.user/);
    assert.throws(() => tierDir('org', projectDir, { homeDir: fakeHome }), /requires opts.org/);
    assert.doesNotThrow(() => tierDir('feature', projectDir, { homeDir: fakeHome, feature: 'checkout' }));
  } finally { cleanup(projectDir, fakeHome); }
});

test('an unknown tier name throws rather than silently resolving somewhere', () => {
  const { projectDir, fakeHome } = makeDirs();
  try {
    assert.throws(() => tierDir('workspace', projectDir, { homeDir: fakeHome }), /unknown tier/);
  } finally { cleanup(projectDir, fakeHome); }
});

test('readTier reads dated and undated bullets from all 3 store files', () => {
  const { projectDir, fakeHome } = makeDirs();
  try {
    const dir = tierDir('project', projectDir, { homeDir: fakeHome });
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'MEMORY.md'), '- Stack: Node + SQLite.\n');
    writeFileSync(join(dir, 'decisions.md'), '- 2026-07-20: Chose SQLite.\n');
    writeFileSync(join(dir, 'tried.md'), '- 2026-07-21: A heavier ORM, reverted.\n');
    const entries = readTier('project', projectDir, { homeDir: fakeHome });
    assert.equal(entries.length, 3);
    assert.ok(entries.every((e) => e.tier === 'project'));
    assert.ok(entries.some((e) => e.source === 'memory' && e.date === null));
    assert.ok(entries.some((e) => e.source === 'decisions' && e.date === '2026-07-20'));
    assert.ok(entries.some((e) => e.source === 'tried' && e.date === '2026-07-21'));
  } finally { cleanup(projectDir, fakeHome); }
});

test('readAllTiers orders narrowest-first and never merges tiers together', () => {
  const { projectDir, fakeHome } = makeDirs();
  try {
    writeTierEntry('task', projectDir, 'MEMORY', 'task-scoped fact', { homeDir: fakeHome, task: 't1' });
    writeTierEntry('user', projectDir, 'MEMORY', 'user-scoped fact', { homeDir: fakeHome, user: 'founder' });
    writeTierEntry('feature', projectDir, 'MEMORY', 'feature-scoped fact', { homeDir: fakeHome, feature: 'checkout' });
    writeTierEntry('project', projectDir, 'MEMORY', 'project-scoped fact', { homeDir: fakeHome });
    writeTierEntry('org', projectDir, 'MEMORY', 'org-scoped fact', { homeDir: fakeHome, org: 'acme', approved: true });
    writeTierEntry('global', projectDir, 'MEMORY', 'global-scoped fact', { homeDir: fakeHome, approved: true });

    const entries = readAllTiers(projectDir, { homeDir: fakeHome, feature: 'checkout', task: 't1', user: 'founder', org: 'acme' });
    const tierOrder = entries.map((e) => e.tier);
    // task/user/feature/project/org/global, in that order -- narrowest first.
    assert.deepEqual(tierOrder, ['task', 'user', 'feature', 'project', 'org', 'global']);
  } finally { cleanup(projectDir, fakeHome); }
});

test('readAllTiers skips feature/task/user/org tiers with no identifier supplied', () => {
  const { projectDir, fakeHome } = makeDirs();
  try {
    writeTierEntry('project', projectDir, 'MEMORY', 'just the project fact', { homeDir: fakeHome });
    const entries = readAllTiers(projectDir, { homeDir: fakeHome });
    assert.deepEqual(entries.map((e) => e.tier), ['project']);
  } finally { cleanup(projectDir, fakeHome); }
});

test('writeTierEntry refuses a secret-shaped string at every tier', () => {
  const { projectDir, fakeHome } = makeDirs();
  try {
    assert.throws(
      () => writeTierEntry('project', projectDir, 'MEMORY', 'AWS key AKIAABCDEFGHIJKLMNOP', { homeDir: fakeHome }),
      /refusing to write a secret/,
    );
    assert.throws(
      () => writeTierEntry('global', projectDir, 'MEMORY', 'ghp_' + 'a'.repeat(36), { homeDir: fakeHome, approved: true }),
      /refusing to write a secret/,
    );
  } finally { cleanup(projectDir, fakeHome); }
});

test('writing to global or org without approval throws; project/feature/task/user never require it', () => {
  const { projectDir, fakeHome } = makeDirs();
  try {
    assert.throws(
      () => writeTierEntry('global', projectDir, 'MEMORY', 'a fact', { homeDir: fakeHome }),
      /requires explicit founder approval/,
    );
    assert.throws(
      () => writeTierEntry('org', projectDir, 'MEMORY', 'a fact', { homeDir: fakeHome, org: 'acme' }),
      /requires explicit founder approval/,
    );
    assert.doesNotThrow(() =>
      writeTierEntry('global', projectDir, 'MEMORY', 'a fact', { homeDir: fakeHome, approved: true }));
    assert.doesNotThrow(() =>
      writeTierEntry('project', projectDir, 'MEMORY', 'a fact', { homeDir: fakeHome }));
    assert.doesNotThrow(() =>
      writeTierEntry('feature', projectDir, 'MEMORY', 'a fact', { homeDir: fakeHome, feature: 'x' }));
  } finally { cleanup(projectDir, fakeHome); }
});

test('APPROVAL_REQUIRED_TIERS names exactly global and org, nothing in-repo', () => {
  assert.deepEqual([...APPROVAL_REQUIRED_TIERS].sort(), ['global', 'org']);
});

test('a fact written at global tier is visible from a second, unrelated project', () => {
  const { fakeHome } = makeDirs();
  const projectA = mkdtempSync(join(tmpdir(), 'wingman-project-a-'));
  const projectB = mkdtempSync(join(tmpdir(), 'wingman-project-b-'));
  try {
    writeTierEntry('global', projectA, 'MEMORY', 'founder prefers pnpm', { homeDir: fakeHome, approved: true });
    const seenFromB = readAllTiers(projectB, { homeDir: fakeHome });
    assert.ok(seenFromB.some((e) => e.tier === 'global' && e.text === 'founder prefers pnpm'));
  } finally { cleanup(projectA, projectB, fakeHome); }
});

test('a project-tier fact is NOT visible from a different project (no cross-project leak)', () => {
  const { fakeHome } = makeDirs();
  const projectA = mkdtempSync(join(tmpdir(), 'wingman-project-a-'));
  const projectB = mkdtempSync(join(tmpdir(), 'wingman-project-b-'));
  try {
    writeTierEntry('project', projectA, 'MEMORY', 'a fact only about project A', { homeDir: fakeHome });
    const seenFromB = readAllTiers(projectB, { homeDir: fakeHome });
    assert.ok(!seenFromB.some((e) => e.text.includes('project A')));
  } finally { cleanup(projectA, projectB, fakeHome); }
});
