// Red-team suite for secret-guard.mjs's decide()/SECRET/DESTRUCTIVE -- and the Codex CLI/OpenCode
// ports, same rationale as prompt-injection.test.mjs: a hand-copied port can silently drift from
// canonical and check-harness-adapter-drift.mjs would never notice (it checks Boardroom-persona/
// skill drift, not these hook files).
//
// 2026-07-27 finding, fixed in canonical and hand-synced into both ports: `git push origin main
// --force` -- the single most common real-world way to actually type a force push, with the
// remote/branch positional args first and the flag last -- bypassed the DESTRUCTIVE check
// entirely. Only a bare `git push --force` (flag immediately after "push") was ever caught. Fixed
// by allowing up to 3 positional args before the flag.
//
// The two ports' `decide()` return shape differs from canonical's ({allow: bool} vs
// {decision: 'allow'|'deny'}) and their field-name/tool-name conventions differ too (Codex maps
// both Bash and apply_patch to tool_input.command; OpenCode uses lowercase tool names and
// camelCase args) -- each block below calls its target the way that harness actually would, not a
// copy-pasted canonical call.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide as decideCanonical } from '../../plugins/wingman/hooks/secret-guard.mjs';
import { decide as decideCodex } from '../../plugins/wingman/references/harness-adapters/codex-cli/.codex/hooks/secret-guard.mjs';
import { decide as decideOpenCode } from '../../plugins/wingman/references/harness-adapters/opencode/.opencode/plugin/secret-guard.js';

test('canonical: git push with positional args before --force is now caught', () => {
  const cases = [
    'git push --force',
    'git push origin main --force',
    'git push --force origin main',
    'git push -f',
    'git push origin --force-with-lease', // pre-existing behavior, not this fix's concern
  ];
  for (const cmd of cases) {
    assert.equal(decideCanonical('Bash', { command: cmd }).decision, 'deny', `expected deny for: ${cmd}`);
  }
});

test('canonical: ordinary non-force pushes are still allowed (no new false positive)', () => {
  const cases = ['git push', 'git push origin main', 'git push origin feature/my-branch'];
  for (const cmd of cases) {
    assert.equal(decideCanonical('Bash', { command: cmd }).decision, 'allow', `expected allow for: ${cmd}`);
  }
});

test('codex-cli port: git push with positional args before --force is now caught', () => {
  // Codex maps both Bash and apply_patch to tool_input.command -- this is the real call shape for
  // that harness, not a copy of canonical's own field name by coincidence.
  const cases = ['git push --force', 'git push origin main --force'];
  for (const cmd of cases) {
    assert.equal(decideCodex('Bash', { command: cmd }).allow, false, `expected blocked for: ${cmd}`);
  }
  assert.equal(decideCodex('Bash', { command: 'git push origin main' }).allow, true);
});

test('opencode port: git push with positional args before --force is now caught', () => {
  // OpenCode's real tool-name/field-name convention: lowercase 'bash', args.command (confirmed
  // live per this file's own header comment).
  const cases = ['git push --force', 'git push origin main --force'];
  for (const cmd of cases) {
    assert.equal(decideOpenCode('bash', { command: cmd }).allow, false, `expected blocked for: ${cmd}`);
  }
  assert.equal(decideOpenCode('bash', { command: 'git push origin main' }).allow, true);
});

test('documented residual risk -- destructive-command evasion the fix does not close (known limits, not regressions)', () => {
  // Not fixed, not expected to be fixable by pattern-matching alone -- asserted so a future
  // accidental fix is visible rather than silently assumed to still be a gap.
  const stillBypasses = [
    'X=/; rm -rf $X', // destructive path built via a shell variable, never appears as a literal
    'cd / && rm -rf ./', // no leading slash literal in the rm invocation itself
  ];
  for (const cmd of stillBypasses) {
    assert.equal(decideCanonical('Bash', { command: cmd }).decision, 'allow', `expected this KNOWN gap to still bypass: ${cmd}`);
  }
});

// Normalizes canonical's {decision: 'allow'|'deny'} and the ports' {allow: bool} into one boolean,
// so the same assertion works against all three without three copies of the same logic.
function isBlocked(result) {
  return result.decision === 'deny' || result.allow === false;
}

test('documented residual risk -- secret-pattern evasion the fix does not close (known limits, not regressions; same SECRET list on all 3 copies)', () => {
  const stillBypasses = [
    'const k = "AKIA" + "IOSFODNN7EXAMPLE"', // AWS key split across a string concatenation
    Buffer.from('AKIAIOSFODNN7EXAMPLE').toString('base64'), // base64-encoded secret
    'password=\'abc\'', // generic secret pattern requires 20+ chars; a short password slips through
  ];
  for (const [name, decide, toolName] of [
    ['canonical', decideCanonical, 'Bash'],
    ['codex-cli', decideCodex, 'Bash'],
    ['opencode', decideOpenCode, 'bash'],
  ]) {
    for (const cmd of stillBypasses) {
      assert.equal(isBlocked(decide(toolName, { command: cmd })), false, `${name} expected this KNOWN gap to still bypass: ${cmd}`);
    }
  }
});
