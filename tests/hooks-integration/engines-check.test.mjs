// Tests for plugins/wingman/scripts/engines-check.mjs -- the engine-ownership rule that keeps
// the 22 ENGINE.md manifests (17 originally, reorganized 2026-07-30 into 22 via the EngineOS pass)
// from being speculative structure with no consumer.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseMembers, checkEngineOwnership } from '../../plugins/wingman/scripts/engines-check.mjs';

function makeEngine(name, members) {
  const lines = members.map((m) => `- \`${m}\``).join('\n');
  return {
    name,
    membersText: `# Engine: ${name}\n\n## Members\n\n${lines}\n\n## State read + written\n\nSome text.\n`,
  };
}

test('parseMembers extracts backtick-quoted member paths from the Members section', () => {
  const text = '# Engine: Foo\n\n## Members\n\n- `commands/foo.md`\n- `skills/bar/SKILL.md`\n\n## Next\n\nOther text.\n';
  assert.deepEqual(parseMembers(text), ['commands/foo.md', 'skills/bar/SKILL.md']);
});

test('parseMembers returns empty for a not-yet-built engine with no Members heading content', () => {
  const text = '# Engine: Foo\n\n## Members\n\n(none yet)\n';
  assert.deepEqual(parseMembers(text), []);
});

test('a fully-owned, fully-existing file set passes with zero problems', () => {
  const engines = [
    makeEngine('vision-engine', ['commands/discovery.md']),
    makeEngine('engineering-engine', ['commands/build.md', 'skills/tdd/SKILL.md']),
  ];
  const realFiles = ['commands/discovery.md', 'commands/build.md', 'skills/tdd/SKILL.md'];
  assert.deepEqual(checkEngineOwnership({ engines, realFiles }).errors, []);
});

test('a real file with no engine owner is reported as an orphan', () => {
  const engines = [makeEngine('vision-engine', ['commands/discovery.md'])];
  const realFiles = ['commands/discovery.md', 'commands/orphan.md'];
  const { errors } = checkEngineOwnership({ engines, realFiles });
  assert.ok(errors.some((e) => e.includes('"commands/orphan.md" has no engine owner')));
});

test('a member claimed by two engines is reported, not silently overwritten', () => {
  const engines = [
    makeEngine('vision-engine', ['commands/discovery.md']),
    makeEngine('research-engine', ['commands/discovery.md']),
  ];
  const realFiles = ['commands/discovery.md'];
  const { errors } = checkEngineOwnership({ engines, realFiles });
  assert.ok(errors.some((e) => e.includes('claimed by both "vision-engine" and "research-engine"')));
});

test('a declared member that does not exist on disk is reported', () => {
  const engines = [makeEngine('vision-engine', ['commands/does-not-exist.md'])];
  const realFiles = [];
  const { errors } = checkEngineOwnership({ engines, realFiles });
  assert.ok(errors.some((e) => e.includes('does not exist on disk')));
});

test('the real 22 engine manifests, run against the real plugin file set, pass with zero problems', () => {
  const pluginRoot = join(process.cwd(), 'plugins', 'wingman');
  const enginesRoot = join(pluginRoot, 'engines');

  const engines = [];
  for (const entry of readdirSync(enginesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    engines.push({
      name: entry.name,
      membersText: readFileSync(join(enginesRoot, entry.name, 'ENGINE.md'), 'utf-8'),
    });
  }
  assert.strictEqual(engines.length, 22, 'expected all 22 engine manifests to be found');

  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return [];
    }
    const files = [];
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) files.push(...walk(full));
      else files.push(full);
    }
    return files;
  }

  const realFiles = [];
  for (const f of walk(join(pluginRoot, 'commands'))) {
    if (f.endsWith('.md') && !f.endsWith('/README.md')) realFiles.push(f);
  }
  for (const f of walk(join(pluginRoot, 'skills'))) {
    if (f.endsWith('/SKILL.md')) realFiles.push(f);
  }
  for (const entry of readdirSync(join(pluginRoot, 'hooks'), { withFileTypes: true })) {
    if (!entry.isDirectory() && entry.name.endsWith('.mjs')) realFiles.push(join(pluginRoot, 'hooks', entry.name));
  }
  for (const entry of readdirSync(join(pluginRoot, 'agents'), { withFileTypes: true })) {
    if (!entry.isDirectory() && entry.name.endsWith('.md')) realFiles.push(join(pluginRoot, 'agents', entry.name));
  }
  for (const entry of readdirSync(join(pluginRoot, 'references'), { withFileTypes: true })) {
    if (!entry.isDirectory() && entry.name.endsWith('.md')) realFiles.push(join(pluginRoot, 'references', entry.name));
  }
  const relFiles = realFiles.map((f) => f.slice(pluginRoot.length + 1));

  const { errors } = checkEngineOwnership({ engines, realFiles: relFiles });
  assert.deepEqual(errors, [], `expected zero engine-ownership problems, got: ${errors.join('; ')}`);
});
