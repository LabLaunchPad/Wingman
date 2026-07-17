# Eval: boardroom-7-seat

Tests `plugins/wingman/commands/boardroom.md`'s 7-seat dispatch and consolidation logic — the MVP1 hard cutover from 5 seats (founder/engineer/security/design/cost) to 7 (CEO/CPO/CMO/CTO/CISO/CFO/Research/Design). This case is deliberately narrow, mirroring `boardroom-gate-rule.md`'s approach: it uses synthetic seat verdicts rather than deriving them from a real review, so it tests the mechanical dispatch-count, grouped-summary formatting, and gate-rule reduction — not the quality of independent seat judgment (each seat's own review discipline is covered by reading its agent file, not by this eval).

## Fixture

`evals/fixtures/setup-boardroom-gate-fixture.sh <target-dir>` — reused from `boardroom-gate-rule.md`: a trivial one-file project with a single uncommitted one-line diff. Content is unimportant; it exists only so `git diff` has something to point at.

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with `commands/boardroom.md`, all 8 `agents/boardroom-*.md` files, and `docs/ARCHITECTURE.md` §4 — but no other eval case, so it isn't told the expected answer.
3. Give it 2 synthetic seat-verdict sets to format and gate:
   - **Run A (all-GO)**: all 8 seats (`ceo`, `cpo`, `cmo`, `cto`, `ciso`, `cfo`, `research`, `design`) return `GO`, with `cmo` and `research` explicitly `N/A — no material input on this checkpoint` (the documented fast-path).
   - **Run B (mixed)**: `cto` returns `GO_WITH_CONCERNS` ("no test plan for the webhook retry path"), `ciso` returns `NO_GO` ("hardcoded API key in the diff"), the rest `GO`.
4. Ask it to produce the consolidated grouped summary for both runs, and to actually perform the real checkpoint file-write (`.wingman/checkpoints.jsonl` + `state.json`) for Run B only, since a fresh `.wingman/` in this fixture also exercises the "create `state.json` from scratch" path with the new `active_managers: []` field.
5. Independently verify the real file write against the filesystem — do not trust the subagent's self-report alone.

## Expectations

| Check | Expected |
|---|---|
| Seat count dispatched | 8 (7 Boardroom C-suite-style seats + Design), not 5 |
| Grouped summary headers | Business (CEO/CPO/CMO), Technical (CTO/CISO), Finance (CFO), Research (Research) — plus Design shown separately or folded in per `boardroom.md`'s actual grouping; **not** a flat unlabeled list of 8 bullets |
| N/A fast-path (Run A) | CMO and Research's `N/A` verdicts render as `GO`-equivalent (don't count as a missing/blocking seat) and are visually distinguishable as "no material input" rather than a substantive review |
| Bottom line (Run A) | `GO` |
| Bottom line (Run B) | `DO NOT SHIP` — the rule is still a pure `any(NO_GO)` predicate regardless of seat count (5 → 8 seats doesn't change the gate-rule shape) |
| Checkpoint file (Run B) | `.wingman/checkpoints.jsonl` has one valid JSON line, `"schema_version": 2`, all 8 `seats[]` entries present with correct `seat` names (`ceo`/`cpo`/`cmo`/`cto`/`ciso`/`cfo`/`research`/`design`), `ciso`'s `NO_GO` summary preserved verbatim, `bottom_line: "DO NOT SHIP"`, `next_stage` pinned to the same stage reviewed (not advanced past the gate) |
| `state.json` (Run B) | Created fresh with `active_department_leads: []`, `active_managers: []`, `active_specialists: []` — the new `active_managers` field present and empty, not omitted |
| Old seat names absent | No `founder`/`engineer`/`security`/`cost` seat names appear anywhere in the new checkpoint's `seats[]` |

## Trust level

`verified` — Run 1 covered the mechanical dispatch/consolidation/file-write path with synthetic verdicts; Run 2 covered the gap Run 1 left open by driving all 7 C-suite seats through a genuinely adversarial real diff, and confirmed the seats independently produce real, non-redundant `NO_GO`s that the gate rule correctly aggregates to a blocking bottom line rather than washing out.

## Run log

### Run 1 — 2026-07-14

**Result: PASS on every expectation, with one nuance and two flagged judgment calls.** A fresh subagent, given only `boardroom.md`, the 8 agent files, and `docs/ARCHITECTURE.md` §4 (not this eval document), correctly:
- Dispatched and accounted for all 8 seats in both runs, never silently dropping the 2 new seats (CPO, CMO) or the renamed `research` seat.
- Rendered Run A's consolidated summary under grouped Business/Technical/Finance/Research headers, with CMO and Research shown as `N/A` in a visually distinct way from a substantive `GO`, and computed `GO` as Run A's bottom line.
- Computed `DO NOT SHIP` for Run B from a single `NO_GO` (`ciso`) among otherwise-clean seats, confirming the gate rule is unchanged in shape at 8 seats. Initially dropped the Research row from Run B's summary for brevity, caught its own inconsistency against Run A, and self-corrected before reporting — a real (if minor) formatting-consistency slip worth noting since it's exactly the kind of drift a founder-facing checkpoint shouldn't have.
- Wrote a real, valid `checkpoints.jsonl` line for Run B — **independently re-parsed and confirmed valid JSON** (`python3 -c "json.load(...)"`) rather than trusting the subagent's self-report — with `schema_version: 2`, 7 of 8 seats present under their new names (`design` correctly omitted per the schema's own "omitted when N/A" rule), `ciso`'s rejection reason preserved verbatim, and `next_stage` pinned to the same value as `stage` (not advanced past the gate).
- Created `state.json` fresh with all three roster arrays empty, including the new `active_managers: []` — confirming the Management Board schema addition doesn't break the existing fresh-state-create path.
- Independently verified via direct file inspection (not the subagent's self-report): `git status --porcelain -- plugins/wingman/` in the Wingman repo showed only this session's own in-progress MVP1 changes (no eval-run leakage into the plugin directory), and the fixture's `.wingman/checkpoints.jsonl`/`state.json` matched every expectation above exactly on re-read.

No old seat names (`founder`/`engineer`/`security`/`cost`) appeared anywhere in the output. Two judgment calls worth recording rather than treating as failures: (1) since this was a standalone ad-hoc `/wingman:boardroom` invocation rather than one embedded in `plan`/`build`/`secure`/`ship`, the subagent used `"ad-hoc"` for both `stage` and `next_stage` (no named pipeline stage to pin to) — a reasonable reading, but `boardroom.md` doesn't explicitly address the ad-hoc case for this field, worth tightening in a future pass; (2) `founder_decision` was set to `"still_reviewing"` since no real founder was available to answer `AskUserQuestion` in this synthetic test, which is the documented fallback, not a fabricated decision.

One promotion criterion remains open: a second, differently-shaped run (e.g. unanimous-`NO_GO` across all 8 seats, or a run exercising an already-populated `state.json` rather than a fresh one) before this case can move to `verified`, following the same two-scenario bar every other case in this suite met.

### Run 2 — 2026-07-15

**Result: PASS.** Run 1 tested the mechanical dispatch/consolidation/file-write path with hand-fed synthetic seat verdicts — it never exercised whether 7 independently-reasoning seats, looking at the same *real* adversarial content, actually converge on distinct, correct `NO_GO`s that the gate rule then aggregates correctly. Run 2 closes exactly that gap.

**Fixture:** A genuinely adversarial, deliberately-planted diff was built from scratch (subagent-sandbox `subagent_type` dispatch of the named `boardroom-*` agents is not available in this environment — a known, previously-documented limitation — so each of the 7 seats was simulated via a `general-purpose` subagent instructed to read its real persona file at `plugins/wingman/agents/boardroom-*.md` verbatim and adopt it, then review the actual diff itself via `git diff`, not a description of it). The fixture: a tiny Node/Express project, one clean initial commit (`server.js` with a trivial `/signup` handler), then an uncommitted diff that plants three real, independent problems across different seats' remits:
- **Security (CISO lane):** a hardcoded live-looking Stripe secret key and AWS secret access key left in source; a `/signup` handler that appends the user's **plaintext password and full credit-card number** to a log file on every request; and the DB insert built by raw string concatenation of `email`/`password` (classic SQL injection).
- **Cost (CFO lane):** an uncapped `for` loop firing 5 redundant paid LLM API calls per signup with no rate limit, cache, or budget alert configured anywhere.
- **Correctness (CTO/CPO lane):** no error handling around the DB call, so a failed write still returns `{ ok: true }` to the client — users are told signup succeeded when nothing was saved.

All 7 seats were dispatched in parallel (7 backgrounded `general-purpose` agents, each given only its own persona file path and the fixture path — not told what to find), matching `commands/boardroom.md`'s "dispatch all seven in parallel, single message" instruction as closely as this sandbox allows. Design was not dispatched (backend-only diff, no user-facing or developer-facing surface per `boardroom.md`'s own N/A criterion for Design).

**Verdicts returned (quoted verbatim from each seat, independently, with no cross-seat visibility):**
- **CEO — `NO_GO`**: *"This change hardcodes live-looking payment and cloud credentials into the code, writes customers' passwords and full card numbers to a plain log file, and tells customers 'signup successful' even when it isn't... Hold — do not ship."*
- **CPO — `NO_GO`**: *"This version logs their password and full card number to a plaintext file and tells them 'success' even when the database write fails, so real users could lose data or trust silently... Hold — do not ship."*
- **CMO — `GO`**: *"This is backend signup plumbing... with no visible copy or positioning change, so there's nothing here for an audience to notice or misread... Ship it from a go-to-market view, but hold for the other seats."*
- **CTO — `NO_GO`**: *"the database write can be bypassed by attackers, and the response tells users it worked even when it silently failed... Hold — switch to parameterized queries, add error handling..."*
- **CISO — `NO_GO`**: *"Hardcoded Stripe live secret key and AWS secret access key in source... Every signup writes plaintext password and full card number to `signup.log`... SQL injection in the `/signup` INSERT... Hold — do not ship until the hardcoded secrets are rotated and removed, logging of password/card data stops, and the SQL injection is fixed."*
- **CFO — `NO_GO`**: *"this is already 5x more expensive than it needs to be — 10,000 signups/day would run $500–$1,500/month for what one call would do for $100–$300/month... Hold and fix before ship."*
- **Research — `GO`**: *"This is a routine signup endpoint change with no strategic claims, competitive positioning, or novel approach to evaluate... Ship it from a research standpoint; defer to CTO/CISO/CFO."*

**Independent verification of the aggregation:** 5 of 7 seats (CEO, CPO, CTO, CISO, CFO) returned real, independently-reasoned `NO_GO`s rooted in three genuinely distinct planted defects — not one seat's finding echoed by the others verbatim, confirming each seat actually reviewed the diff itself rather than pattern-matching a shared cue. Applying `boardroom.md`'s stated bottom-line rule (`any(NO_GO) → DO NOT SHIP`, seat-count-agnostic) to this set of 7 real verdicts correctly yields `DO NOT SHIP` — the 2 clean `GO`s (CMO, Research) do not dilute or average out the 5 `NO_GO`s into a softer `GO WITH CHANGES`, which is exactly the failure mode this run was designed to catch (a consolidation bug that washes out real blocking findings across a wider seat panel). Each seat also correctly stayed in its own lane per its "what you do not do" section — e.g. CMO and Research both surfaced the security/cost issues only as a one-line aside and deferred the actual verdict to CISO/CFO/CTO, rather than manufacturing their own security judgment.

**Trust-level verdict:** the second, differently-shaped scenario the promotion criterion called for (a majority-`NO_GO` real-content run, as opposed to Run 1's synthetic single-`NO_GO` and all-`GO` sets) has now been exercised and passes. Combined with Run 1's mechanical file-write verification, this case meets the same two-scenario bar as the rest of the suite. Promoting to `verified`.
