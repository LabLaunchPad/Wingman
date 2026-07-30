// Tests for plugins/wingman/scripts/knowledge-index.mjs -- the Knowledge Engine's searchability
// layer (PR8). Zero-dependency, no embeddings -- keyword scoring over title/headings/path only.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseDoc, buildIndex, searchIndex } from '../../plugins/wingman/scripts/knowledge-index.mjs';

test('parseDoc extracts the H1 title and all H2+ headings', () => {
  const text = '# My Title\n\nIntro text.\n\n## Section One\n\nBody.\n\n### Subsection\n\nMore.\n';
  const { title, headings } = parseDoc(text);
  assert.equal(title, 'My Title');
  assert.deepEqual(headings, ['Section One', 'Subsection']);
});

test('parseDoc falls back to "(untitled)" when there is no H1', () => {
  const { title } = parseDoc('## Just a heading\n\nNo H1 here.\n');
  assert.equal(title, '(untitled)');
});

test('buildIndex maps raw docs to path/title/headings entries', () => {
  const docs = [{ path: 'references/foo.md', text: '# Foo\n\n## Bar\n' }];
  const index = buildIndex(docs);
  assert.deepEqual(index, [{ path: 'references/foo.md', title: 'Foo', headings: ['Bar'] }]);
});

test('searchIndex ranks a title match above a path-only match', () => {
  const index = [
    { path: 'references/unrelated.md', title: 'Something Else', headings: ['permission note'] },
    { path: 'references/permission-model.md', title: 'Permission Model', headings: ['Tiers'] },
  ];
  const results = searchIndex(index, 'permission');
  assert.equal(results[0].path, 'references/permission-model.md');
  assert.ok(results[0].score > results[1].score);
});

test('searchIndex returns an empty array for a query with zero matches', () => {
  const index = [{ path: 'references/foo.md', title: 'Foo', headings: ['Bar'] }];
  assert.deepEqual(searchIndex(index, 'nonexistent gibberish'), []);
});

test('searchIndex reports which specific headings matched', () => {
  const index = [
    { path: 'references/foo.md', title: 'Foo', headings: ['Cost tracking', 'Unrelated section'] },
  ];
  const results = searchIndex(index, 'cost');
  assert.deepEqual(results[0].matchedHeadings, ['Cost tracking']);
});

test('a real query against the real plugin references/ tree returns real, existing paths', () => {
  const pluginRoot = join(process.cwd(), 'plugins', 'wingman');
  const referencesDir = join(pluginRoot, 'references');
  const docs = [];
  for (const entry of readdirSync(referencesDir, { withFileTypes: true })) {
    if (entry.isDirectory() || !entry.name.endsWith('.md')) continue;
    docs.push({
      path: `references/${entry.name}`,
      text: readFileSync(join(referencesDir, entry.name), 'utf-8'),
    });
  }
  const index = buildIndex(docs);
  const results = searchIndex(index, 'permission tiers');
  assert.ok(results.length > 0, 'expected at least one real match for "permission tiers"');
  assert.ok(results.some((r) => r.path === 'references/permission-model.md'));
});
