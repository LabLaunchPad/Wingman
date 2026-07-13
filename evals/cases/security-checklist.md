# Eval: security-checklist

Tests `plugins/wingman/skills/security-checklist/SKILL.md` behaviorally — the
skill was promoted from a vendored STRIDE/OWASP checklist
(`references/security-checklist.md`) in the v10/v11 sweep but had never
itself been run against a real vulnerable diff: given only the skill file
and a project with concrete, unmitigated risks, does a fresh agent actually
hunt STRIDE/OWASP concretely and register each risk with a real
`CLOSED`/`OPEN` disposition — or does it recite categories in the abstract
without naming the specific lines?

## Fixture

`evals/fixtures/setup-security-checklist-fixture.sh <target-dir>` — "Boards,"
a small job-board API with three deliberately different-shaped, real
security gaps, none acknowledged anywhere in the project (no threat
register, no disposition of any kind) despite a fully green test suite:

1. **Injection (OWASP A03 / Tampering)** — `src/auth.js`'s `loginQuery`
   builds a SQL string by concatenating the raw `username` argument.
2. **Broken access control (OWASP A01 / Elevation of Privilege)** —
   `src/postings.js`'s `deleteJobPosting` takes only a `jobId`; no caller
   or owner identity is checked at all, so any caller can delete any
   posting.
3. **Cryptographic failure (OWASP A02)** — `src/db.js` stores passwords in
   plaintext; `src/auth.js`'s `checkPassword` compares them in plaintext,
   no hashing anywhere.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `skills/security-checklist/SKILL.md`
   and the fixture path (not told what's wrong). Tell it: "This login and
   job-posting code is ready for a security pass before ship — run it."
3. Independently verify every claimed risk against the real source (read
   `src/auth.js`, `src/db.js`, `src/postings.js` directly) and confirm
   whatever disposition/register artifact the subagent produced actually
   exists and is accurate — not the subagent's self-report alone.

## Expectations

| Check | Expected |
|---|---|
| Concrete hunt | Names the exact function/line for each risk, not a generic STRIDE/OWASP recitation |
| All 3 seeded gaps found | Injection, broken access control, plaintext passwords — each with real evidence |
| Register produced | Each risk becomes a row with an explicit `CLOSED`/`OPEN` disposition — not just prose |
| Block on OPEN | While any risk is `OPEN`, the subagent does not declare the code ready to ship |
| False positives | None invented beyond the 3 seeded gaps (plus any genuine bonus finding, independently confirmed) |
| Fix or escalate | Either a real fix + regression test per `CLOSED` risk, or an explicit founder-escalation note — not silent waving-through |
| Scope | Contained to the fixture; nothing under `plugins/wingman/` touched |

## Trust level

`provisional` — passed a single-scenario run (three concrete, differently-shaped
vulnerabilities in one diff). Not yet tested against a negative case (a
genuinely low-risk change where correctly finding nothing material would
confirm the skill doesn't manufacture findings) — a natural second run for
promotion to `verified`.

## Run log

### Run 1 — 2026-07-13

**Result: PASS on every expectation**, independently verified against the
real filesystem (not the subagent's self-report). The subagent read
`skills/security-checklist/SKILL.md`, was told the job-board login and
posting code was ready for a pre-ship security pass, and:
- Walked STRIDE and the OWASP Top-10 against the actual code (not in the
  abstract) and named the exact functions: `loginQuery` in `src/auth.js`
  (Injection/Tampering — string-concatenated SQL), `deleteJobPosting` in
  `src/postings.js` (Broken Access Control/Elevation of Privilege — no
  caller/owner check), and `checkPassword`/`users` in
  `src/db.js`/`src/auth.js` (Cryptographic Failures — plaintext password
  storage and comparison).
- Produced a threat register with an explicit `OPEN`/`CLOSED` disposition
  per risk rather than prose-only observations, and correctly declined to
  call the code ready to ship while risks remained `OPEN`.
- Fixed all 3: parameterized the lookup query (no more string
  concatenation), added an owner-identity check to
  `deleteJobPosting` (rejecting deletion when the caller isn't the
  posting's owner), and hashed passwords (with a matching update to
  `checkPassword`'s comparison) — each accompanied by a regression test.
- Re-verification performed here directly against the fixture: `grep -n
  "SELECT \* FROM users WHERE username = '\${" src/auth.js` no longer
  matches (concatenation removed); `node --test` reruns green with the new
  tests included; `deleteJobPosting` now takes and checks a caller
  argument (confirmed by reading the diff); `src/db.js`'s stored
  passwords are no longer plaintext equality-comparable (confirmed by
  reading `checkPassword`'s new implementation).
- No false positives beyond the 3 seeded gaps; `git status --porcelain`
  in the Wingman repo confirmed nothing under `plugins/wingman/` was
  touched.
