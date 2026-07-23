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

`verified` — Run 1 covers the false-negative direction (finds real seeded
vulnerabilities). Run 2 covers the false-positive direction and turned up a
sharper result than a plain "nothing wrong" negative case: given a project
already hardened against the 3 well-known classes Run 1 seeded (injection,
plaintext passwords, IDOR), the skill neither rubber-stamped it nor invented
noise — it found 2 real, subtler bugs the fixture's author hadn't deliberately
planted, correctly left 3 genuinely out-of-scope items (no HTTP/view layer
yet) unregistered as `OPEN` rather than manufacturing findings to look
thorough, and explicitly disclosed "not applicable" (no LLM boundary) rather
than silently skipping the prompt-injection step.

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

### Run 2 — 2026-07-15

**Scenario**: "boards-clean" — a fresh fixture starting from a version of the
same job-board API already hardened against Run 1's 3 seeded classes:
parameterized `Map` lookups (no SQL string-building), bcrypt-hashed passwords
(never plaintext), and an explicit `ownerId !== callerId` check on job-posting
delete. A fresh subagent was given only `security-checklist/SKILL.md` and the
fixture path, told to run a pre-ship security pass, not told the fixture was
meant to be "clean."

**Result**: the subagent did not rubber-stamp it. It found and fixed 2 real,
previously-undisclosed bugs, verified directly against the actual diff:
- **T-01 (account takeover)**: `db.createUser()` silently overwrote an
  existing user's password hash on re-registration of the same username —
  confirmed via `git diff`: `createUser()` now returns `null` on a duplicate
  instead of overwriting, and `registerUser()` throws instead of returning a
  falsy id.
- **T-02 (username-enumeration timing side-channel)**: `checkPassword()`
  skipped the `bcrypt.compareSync()` call entirely for a nonexistent username
  but ran a real (slow) compare for an existing one with a wrong password —
  confirmed via `git diff`: a precomputed `DUMMY_HASH` now makes both paths
  perform exactly one bcrypt compare, closing the timing gap.
- Both dispositioned `CLOSED` with regression tests; re-ran `node --test`
  directly myself — 8/8 passing (6 original + 2 new).
- Correctly left 3 out-of-scope items (rate limiting, input validation,
  output escaping) unregistered as `OPEN` — reasoned explicitly that no HTTP/
  view layer exists yet for them to be exploitable against, rather than
  manufacturing findings to appear thorough.
- Correctly stated prompt-injection defense "not applicable — no LLM
  boundary" rather than silently omitting the step.

Independently verified: `git diff` on `src/auth.js`/`src/db.js` matches the
register's claims exactly (quoted above); `node --test` rerun directly by
this reviewer, not trusted from self-report, shows 8/8 green.

This is stronger evidence than a plain "found nothing, correctly did
nothing" negative case would have been: it demonstrates the skill's hunt is
genuinely concrete (catching subtle bugs the fixture's own author didn't
plant on purpose) while its disposition discipline still holds the line
against inventing findings where none exist.
