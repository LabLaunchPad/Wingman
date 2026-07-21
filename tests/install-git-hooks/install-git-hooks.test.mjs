/**
 * install-git-hooks.mjs Integration Tests
 *
 * Real, in-process verification of the installer's install/uninstall/idempotency/foreign-hook
 * logic -- spawns the real script against a real, disposable git repo, the same way this was
 * manually verified in a scratch clone during development (see docs/PROJECT.md's decisions log).
 * Found via the systematic-auditing pass that added this file: this script previously had zero
 * automated coverage.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

describe('install-git-hooks.mjs', () => {
  const tempDir = path.join(process.cwd(), '.test-temp-install-git-hooks');
  const scriptPath = path.join(process.cwd(), 'plugins', 'wingman', 'scripts', 'install-git-hooks.mjs');
  const hookPath = path.join(tempDir, '.git', 'hooks', 'pre-push');

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

  it('refuses to run against a non-git directory', () => {
    fs.rmSync(path.join(tempDir, '.git'), { recursive: true, force: true });
    const res = run([]);
    assert.notStrictEqual(res.status, 0);
    assert.match(res.stderr, /doesn't look like a git repo/);
  });

  it('installs an executable pre-push hook containing the marker and the correct script path', () => {
    const res = run([]);
    assert.strictEqual(res.status, 0);
    assert.ok(fs.existsSync(hookPath));
    const content = fs.readFileSync(hookPath, 'utf-8');
    assert.match(content, /# wingman-pre-push-hook/);
    assert.match(content, /dod-pre-push-check\.mjs/);
    const mode = fs.statSync(hookPath).mode & 0o777;
    assert.strictEqual(mode & 0o100, 0o100, 'hook should be executable by owner');
  });

  it('quotes a repo path containing a single quote safely (no shell injection)', () => {
    const quotedTempDir = path.join(process.cwd(), ".test-temp-install-git-hooks-quote'd");
    if (fs.existsSync(quotedTempDir)) fs.rmSync(quotedTempDir, { recursive: true, force: true });
    fs.mkdirSync(quotedTempDir, { recursive: true });
    spawnSync('git', ['init', '-q'], { cwd: quotedTempDir });
    try {
      const res = spawnSync('node', [scriptPath, quotedTempDir], { encoding: 'utf-8' });
      assert.strictEqual(res.status, 0);
      const content = fs.readFileSync(path.join(quotedTempDir, '.git', 'hooks', 'pre-push'), 'utf-8');
      // A correctly single-quote-escaped path never contains an unescaped bare quote that would
      // terminate the string early -- the literal 4-char sequence single-quote backslash
      // single-quote single-quote is how POSIX sh embeds a quote inside a single-quoted string,
      // so its presence is what proves this is safe.
      assert.match(content, /'\\''/, "embedded quote should be escaped POSIX-sh style");
    } finally {
      fs.rmSync(quotedTempDir, { recursive: true, force: true });
    }
  });

  it('is idempotent: re-running install on an already-installed hook is a no-op', () => {
    run([]);
    const before = fs.readFileSync(hookPath, 'utf-8');
    const res = run([]);
    assert.strictEqual(res.status, 0);
    assert.match(res.stdout, /already installed/);
    assert.strictEqual(fs.readFileSync(hookPath, 'utf-8'), before);
  });

  it('refuses to overwrite a foreign pre-push hook', () => {
    fs.mkdirSync(path.dirname(hookPath), { recursive: true });
    fs.writeFileSync(hookPath, '#!/bin/sh\necho not-wingman\n');
    const res = run([]);
    assert.notStrictEqual(res.status, 0);
    assert.match(res.stderr, /was not installed by this script/);
    assert.match(fs.readFileSync(hookPath, 'utf-8'), /not-wingman/, 'foreign hook must be untouched');
  });

  it('uninstall removes a self-installed hook', () => {
    run([]);
    assert.ok(fs.existsSync(hookPath));
    const res = run(['--uninstall']);
    assert.strictEqual(res.status, 0);
    assert.ok(!fs.existsSync(hookPath));
  });

  it('uninstall refuses to touch a foreign hook, and leaves it in place', () => {
    fs.mkdirSync(path.dirname(hookPath), { recursive: true });
    fs.writeFileSync(hookPath, '#!/bin/sh\necho not-wingman\n');
    const res = run(['--uninstall']);
    assert.notStrictEqual(res.status, 0);
    assert.ok(fs.existsSync(hookPath), 'foreign hook must not be deleted');
    assert.match(fs.readFileSync(hookPath, 'utf-8'), /not-wingman/);
  });

  it('uninstall with no hook present is a clean no-op', () => {
    const res = run(['--uninstall']);
    assert.strictEqual(res.status, 0);
    assert.match(res.stdout, /nothing to do/);
  });

  it('re-uninstalling after a clean uninstall is also a clean no-op (regression: previously reported the empty leftover file as foreign)', () => {
    run([]);
    run(['--uninstall']);
    const res = run(['--uninstall']);
    assert.strictEqual(res.status, 0);
    assert.match(res.stdout, /nothing to do/);
  });

  it('fails gracefully, not with a raw stack trace, when the hook path is a directory', () => {
    fs.mkdirSync(hookPath, { recursive: true });
    const res = run([]);
    assert.notStrictEqual(res.status, 0);
    assert.match(res.stderr, /couldn't read the existing/);
    assert.doesNotMatch(res.stderr, /at Object\.readFileSync/, 'should not leak a raw Node stack trace');
  });
});
