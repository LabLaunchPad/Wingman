// Tests for the constitution's enforcement check — the mechanism that keeps
// references/constitution.md from becoming the dead weight a ~60-file governance tree was
// already declined for in 2026-07-22 ("the blueprint's files have zero consumer").
//
// Both failure modes below fired for real against the constitution's own first draft, which is
// why they are locked in here rather than trusted to review.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkConstitutionCitations } from '../../plugins/wingman/scripts/constitution-check.mjs';

const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'plugins', 'wingman');
const realExists = (rel) => existsSync(join(pluginRoot, rel));

test('a rule citing a path that does not exist is reported', () => {
  const problems = checkConstitutionCitations(
    '**Enforced by:** `skills/does-not-exist`, `hooks/secret-guard.mjs`.\n\n',
    (rel) => rel === 'hooks/secret-guard.mjs',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /skills\/does-not-exist/);
  assert.match(problems[0], /does not exist/);
});

test('a rule citing a docs/ path is rejected — docs/ does not ship', () => {
  // The real defect this caught: two rules named docs/status/*.md as enforcement. A founder's
  // install has no docs/ directory, so such a rule claims safety coverage that cannot exist.
  const problems = checkConstitutionCitations(
    '**Enforced by:** `docs/status/ARCHITECTURE.md`.\n\n',
    () => true,
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /docs\/ does not ship/);
});

test('a constitution with no enforcement at all is reported', () => {
  const problems = checkConstitutionCitations('# Rules with no mechanism behind them\n', () => true);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /no "\*\*Enforced by:\*\*" lines found/);
});

test('a sound rule produces no problems', () => {
  assert.deepEqual(
    checkConstitutionCitations('**Enforced by:** `skills/memory`.\n\n', (r) => r === 'skills/memory'),
    [],
  );
});

test('every ID in a multi-path Enforced-by line is checked, not just the first', () => {
  const problems = checkConstitutionCitations(
    '**Enforced by:** `skills/memory`, `skills/gone-a`, `hooks/gone-b.mjs`.\n\n',
    (r) => r === 'skills/memory',
  );
  assert.equal(problems.length, 2, 'both missing paths must be reported');
});

test('the real shipped constitution passes against the real filesystem', () => {
  const text = readFileSync(join(pluginRoot, 'references', 'constitution.md'), 'utf-8');
  assert.deepEqual(checkConstitutionCitations(text, realExists), []);
});

test('the real constitution states all ten rules', () => {
  const text = readFileSync(join(pluginRoot, 'references', 'constitution.md'), 'utf-8');
  const rules = [...text.matchAll(/^## \d+\. /gm)];
  assert.equal(rules.length, 10, 'the constitution is ten rules — no more, no fewer');
  // Every rule must name enforcement; a rule without it is aspiration, which is the whole
  // failure mode this file exists to prevent.
  assert.equal([...text.matchAll(/\*\*Enforced by:\*\*/g)].length, 10);
});
