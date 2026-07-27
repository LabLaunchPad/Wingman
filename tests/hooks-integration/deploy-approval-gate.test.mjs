// Unit tests for plugins/wingman/hooks/deploy-approval-gate.mjs's decide() -- the PreToolUse gate
// enforcing references/permission-model.md's Level 3/4 boundary (deploy-class actions require a
// clean Boardroom checkpoint, not agent-identity checking, which no Claude Code hook payload
// supports -- see the hook's own module header).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decide } from '../../plugins/wingman/hooks/deploy-approval-gate.mjs';

function makeProject() {
  const dir = mkdtempSync(join(tmpdir(), 'wingman-deploy-gate-'));
  mkdirSync(join(dir, '.wingman'));
  return dir;
}

function writeCheckpoint(dir, entry) {
  writeFileSync(join(dir, '.wingman', 'checkpoints.jsonl'), JSON.stringify(entry) + '\n');
}

test('non-Bash tool calls are never touched', () => {
  const dir = makeProject();
  assert.equal(decide('Write', { content: 'npm publish' }, dir).decision, 'allow');
  rmSync(dir, { recursive: true, force: true });
});

test('an ordinary, non-deploy-class Bash command is always allowed', () => {
  const dir = makeProject();
  assert.equal(decide('Bash', { command: 'ls -la' }, dir).decision, 'allow');
  assert.equal(decide('Bash', { command: 'git status' }, dir).decision, 'allow');
  rmSync(dir, { recursive: true, force: true });
});

test('a deploy-class command with no Build-stage checkpoint yet is allowed (not a Wingman-piloted project, or Build hasn\'t run)', () => {
  const dir = makeProject();
  assert.equal(decide('Bash', { command: 'npm publish' }, dir).decision, 'allow');
  rmSync(dir, { recursive: true, force: true });
});

test('a deploy-class command with a clean GO checkpoint is allowed', () => {
  const dir = makeProject();
  writeCheckpoint(dir, { bundle: 'build', bottom_line: 'GO', seats: [{ seat: 'cto', verdict: 'GO' }] });
  for (const cmd of ['npm publish', 'kubectl apply -f deploy.yaml', 'terraform apply', 'pnpm publish', 'yarn publish']) {
    assert.equal(decide('Bash', { command: cmd }, dir).decision, 'allow', `expected allow for: ${cmd}`);
  }
  rmSync(dir, { recursive: true, force: true });
});

test('a deploy-class command is denied when the checkpoint is DO NOT SHIP', () => {
  const dir = makeProject();
  writeCheckpoint(dir, { bundle: 'build', bottom_line: 'DO NOT SHIP', seats: [] });
  const result = decide('Bash', { command: 'npm publish' }, dir);
  assert.equal(result.decision, 'deny');
  assert.match(result.reason, /deploy-approval-gate/i);
  rmSync(dir, { recursive: true, force: true });
});

test('a deploy-class command is denied when any seat recorded NO_GO, even with a non-blocking bottom_line', () => {
  const dir = makeProject();
  writeCheckpoint(dir, { bundle: 'build', bottom_line: 'GO_WITH_CHANGES', seats: [{ seat: 'ciso', verdict: 'NO_GO' }] });
  assert.equal(decide('Bash', { command: 'terraform apply' }, dir).decision, 'deny');
  rmSync(dir, { recursive: true, force: true });
});

test('force-pushing to a protected ref is deploy-class; force-pushing a feature branch is not', () => {
  const dir = makeProject();
  writeCheckpoint(dir, { bundle: 'build', bottom_line: 'DO NOT SHIP', seats: [] });
  assert.equal(decide('Bash', { command: 'git push origin main --force' }, dir).decision, 'deny');
  assert.equal(decide('Bash', { command: 'git push origin master --force' }, dir).decision, 'deny');
  assert.equal(decide('Bash', { command: 'git push origin feature/my-branch --force' }, dir).decision, 'allow');
  rmSync(dir, { recursive: true, force: true });
});
