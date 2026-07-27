// Red-team suite for dod-structural-gate.mjs's checkBoardroomVerdictClean() -- attacking the
// checkpoint-record shape a git-push gate trusts, not the founder's prompt or a shell command.
//
// 2026-07-27 findings, both fixed: a `bottom_line` value with doubled internal whitespace
// ("DO  NOT  SHIP") bypassed the exact-string comparison the check used to do, and a seat verdict
// with trailing text ("NO_GO (accepted with conditions)") bypassed its own exact-string comparison
// too. Both are plausible real transcription variants, not just adversarial constructions -- a
// human or a differently-behaved model re-typing a verdict is a far more likely source than an
// actual attacker. Fixed by collapsing whitespace before the bottom_line comparison and matching
// NO_GO as a leading, word-boundary-anchored token rather than requiring exact equality.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkBoardroomVerdictClean } from '../../plugins/wingman/hooks/dod-structural-gate.mjs';

test('doubled/irregular internal whitespace in bottom_line is now caught', () => {
  const cases = ['DO  NOT  SHIP', '  DO NOT   SHIP ', 'DO\tNOT\tSHIP'];
  for (const bottom_line of cases) {
    const result = checkBoardroomVerdictClean({ bottom_line, seats: [] });
    assert.equal(result.ok, false, `expected blocked for bottom_line: ${JSON.stringify(bottom_line)}`);
  }
});

test('a seat verdict with trailing annotation text is now caught as NO_GO', () => {
  const cases = ['NO_GO (accepted with conditions)', 'no_go - see notes', 'NO_GO: blocked pending fix'];
  for (const verdict of cases) {
    const result = checkBoardroomVerdictClean({ bottom_line: 'GO', seats: [{ seat: 'ciso', verdict }] });
    assert.equal(result.ok, false, `expected blocked for verdict: ${JSON.stringify(verdict)}`);
  }
});

test('the fix does not introduce a false positive on GO or GO_WITH_CONCERNS (existing passing behavior, unchanged)', () => {
  assert.equal(checkBoardroomVerdictClean({ bottom_line: 'GO', seats: [{ seat: 'cto', verdict: 'GO' }] }).ok, true);
  assert.equal(
    checkBoardroomVerdictClean({ bottom_line: 'GO_WITH_CHANGES', seats: [{ seat: 'ciso', verdict: 'GO_WITH_CONCERNS' }] }).ok,
    true
  );
  // A word-boundary-anchored NO_GO check must not false-positive on a verdict that merely starts
  // with the letters "NO_GO" as part of a longer, unrelated token.
  assert.equal(checkBoardroomVerdictClean({ bottom_line: 'GO', seats: [{ seat: 'cto', verdict: 'NO_GOOD_REASON_TO_BLOCK' }] }).ok, true);
});

test('documented residual risk: a seat verdict recorded under a differently-cased field name still bypasses (known limit, not a regression)', () => {
  // `Verdict` instead of `verdict` reads as undefined and is never checked. This is a real
  // structural weakness, but a much lower-severity one than the two fixed above: it requires
  // whatever WRITES checkpoints.jsonl (Wingman's own boardroom.md, not an external attacker) to use
  // a nonstandard field name, which the project's own schema already governs elsewhere. Left as a
  // documented, disclosed gap rather than adding key-casing normalization for a write path this
  // hook doesn't control.
  const result = checkBoardroomVerdictClean({ bottom_line: 'GO', seats: [{ seat: 'ciso', Verdict: 'NO_GO' }] });
  assert.equal(result.ok, true, 'expected this KNOWN gap to still bypass (see comment above)');
});
