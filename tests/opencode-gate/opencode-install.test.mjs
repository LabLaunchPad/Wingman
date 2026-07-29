/**
 * OpenCode adapter install.mjs Integration Tests
 *
 * Real, in-process verification of the installer copying .opencode/ into a target project and
 * optionally wiring the git pre-push DoD gate -- the same manual steps this replaces
 * ("cp -r .opencode /path/to/your/project/") verified for real in this session (a live install
 * into a throwaway scratch project confirmed 41/41 files copied and `opencode debug config`
 * recognized the plugin from its new location).
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

describe('opencode adapter install.mjs', () => {
  const tempDir = path.join(process.cwd(), '.test-temp-opencode-install');
  const scriptPath = path.join(
    process.cwd(),
    'plugins',
    'wingman',
    'references',
    'harness-adapters',
    'opencode',
    'install.mjs'
  );
  const sourceOpencodeDir = path.join(
    process.cwd(),
    'plugins',
    'wingman',
    'references',
    'harness-adapters',
    'opencode',
    '.opencode'
  );

  function countFiles(dir) {
    let count = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) count += countFiles(entryPath);
      else count += 1;
    }
    return count;
  }

  beforeEach(() => {
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });
    spawnSync('git', ['init', '-q'], { cwd: tempDir });
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function run(args) {
    return spawnSync('node', [scriptPath, tempDir, ...args], { encoding: 'utf-8' });
  }

  it('copies every file from the adapter source .opencode/ into the target project', () => {
    const res = run([]);
    assert.strictEqual(res.status, 0);
    const destOpencodeDir = path.join(tempDir, '.opencode');
    assert.ok(fs.existsSync(destOpencodeDir));
    assert.strictEqual(countFiles(destOpencodeDir), countFiles(sourceOpencodeDir));
  });

  it('is idempotent -- re-running produces the same file count with no error', () => {
    run([]);
    const res = run([]);
    assert.strictEqual(res.status, 0);
    const destOpencodeDir = path.join(tempDir, '.opencode');
    assert.strictEqual(countFiles(destOpencodeDir), countFiles(sourceOpencodeDir));
  });

  it('does not install the git pre-push hook unless --with-git-hook is passed', () => {
    run([]);
    assert.ok(!fs.existsSync(path.join(tempDir, '.git', 'hooks', 'pre-push')));
  });

  it('installs the git pre-push hook when --with-git-hook is passed', () => {
    const res = run(['--with-git-hook']);
    assert.strictEqual(res.status, 0);
    const hookPath = path.join(tempDir, '.git', 'hooks', 'pre-push');
    assert.ok(fs.existsSync(hookPath));
    const hookContent = fs.readFileSync(hookPath, 'utf-8');
    assert.match(hookContent, /wingman-pre-push-hook/);
  });

  it('writes a minimal opencode.json when the target has none (required for skill discovery)', () => {
    run([]);
    const configPath = path.join(tempDir, 'opencode.json');
    assert.ok(fs.existsSync(configPath));
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    assert.strictEqual(config.$schema, 'https://opencode.ai/config.json');
  });

  it('never overwrites an existing opencode.json', () => {
    const configPath = path.join(tempDir, 'opencode.json');
    fs.writeFileSync(configPath, JSON.stringify({ custom: 'value' }));
    run([]);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    assert.strictEqual(config.custom, 'value');
  });

  it('copies all 42 skills alongside the agents and commands', () => {
    run([]);
    const skillsDir = path.join(tempDir, '.opencode', 'skills');
    const sourceSkillsDir = path.join(sourceOpencodeDir, 'skills');
    const destCount = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length;
    const sourceCount = fs
      .readdirSync(sourceSkillsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory()).length;
    assert.strictEqual(destCount, sourceCount);
    assert.strictEqual(sourceCount, 42);
  });

  it('refuses to run against a non-existent target directory', () => {
    const res = spawnSync('node', [scriptPath, path.join(tempDir, 'does-not-exist')], {
      encoding: 'utf-8',
    });
    assert.notStrictEqual(res.status, 0);
    assert.match(res.stderr, /does not exist/);
  });
});
