// Tests for the WKOS producer-map contract — the mechanism enforcing the one rule that decides
// whether a ~130-document knowledge system is real or dead weight: every document has a real
// producer and a real consumer, or it is a template.
//
// That rule exists because a pasted ~60-file org-governance blueprint was cut to 10 files in
// 2026-07-22 after an audit found its files had "zero consumer... dead weight on creation".

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkProducerMap, parseProducerMap, summarize } from '../../plugins/wingman/scripts/wkos-check.mjs';

const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'plugins', 'wingman');
const realExists = (rel) => existsSync(join(pluginRoot, rel)) || existsSync(join(pluginRoot, rel, 'SKILL.md'));
const realMap = readFileSync(join(pluginRoot, 'references', 'wkos', 'producer-map.md'), 'utf-8');

const row = (doc, status, producer) => `| \`${doc}\` | \`${status}\` | ${producer} |\n`;

test('parses only real table rows, ignoring prose', () => {
  const rows = parseProducerMap(
    'Some prose about producers.\n' + row('A.md', 'produced', '`skills/memory`') + '| not | a | row\n',
  );
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], { doc: 'A.md', status: 'produced', producer: '`skills/memory`' });
});

test('a produced document naming no producer is reported', () => {
  // This is the dead-weight shape: a document claiming to be real with nothing behind it.
  const problems = checkProducerMap(row('A.md', 'produced', 'someone writes it eventually'), () => true);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /names no plugin file that produces it/);
});

test('a produced document naming a nonexistent producer is reported', () => {
  const problems = checkProducerMap(row('A.md', 'produced', '`skills/not-real`'), () => false);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /does not exist in the plugin/);
});

test('a template claiming a producer is reported — a gap must keep looking like a gap', () => {
  const problems = checkProducerMap(row('A.md', 'template', '`skills/memory`'), () => true);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /marked template but names producer/);
});

test('a template with no producer is correct and silent', () => {
  assert.deepEqual(checkProducerMap(row('A.md', 'template', '—'), () => true), []);
});

test('an unknown status is reported', () => {
  const problems = checkProducerMap(row('A.md', 'maybe', '`skills/memory`'), () => true);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /must be one of/);
});

test('a document listed twice is reported', () => {
  const problems = checkProducerMap(
    row('A.md', 'produced', '`skills/memory`') + row('A.md', 'existing', '`skills/research`'),
    () => true,
  );
  assert.ok(problems.some((p) => /appears more than once/.test(p)));
});

test('a producer cited with a CLI flag still resolves', () => {
  // The real bug this caught on first run: anchoring on a closing backtick meant
  // `scripts/check-traceability.mjs --chain` matched nothing and was reported as unproduced.
  const problems = checkProducerMap(
    row('A.md', 'produced', '`scripts/check-traceability.mjs --chain` / `--orphans`'),
    (r) => r === 'scripts/check-traceability.mjs',
  );
  assert.deepEqual(problems, []);
});

test('every path in a multi-producer row is checked, not just the first', () => {
  const problems = checkProducerMap(
    row('A.md', 'existing', '`skills/memory` + `skills/gone-a` + `hooks/gone-b.mjs`'),
    (r) => r === 'skills/memory',
  );
  assert.equal(problems.length, 2);
});

test('an empty map is reported rather than silently passing', () => {
  const problems = checkProducerMap('# No rows here\n', () => true);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /no document rows/);
});

test('the real shipped producer map passes against the real filesystem', () => {
  assert.deepEqual(checkProducerMap(realMap, realExists), []);
});

test('the real map is majority-backed by real machinery, not mostly templates', () => {
  // The whole argument for building WKOS is that it is a contract over machinery that already
  // exists. If templates ever became the majority, that argument would no longer hold and this
  // should fail loudly rather than drift.
  const { total, produced, existing, template } = summarize(realMap);
  assert.ok(total > 50, `expected a substantial map, got ${total} rows`);
  assert.equal(produced + existing + template, total, 'every row must carry a known status');
  assert.ok(
    produced + existing > template,
    `WKOS must stay majority-backed: ${produced + existing} backed vs ${template} templates`,
  );
});
