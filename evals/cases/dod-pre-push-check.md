# Eval: dod-pre-push-check

<!-- eval:no-fixture-needed: constructed inline, mirrors dod-structural-gate.md's own convention for tiny 2-3-file fixtures -->

Tests `plugins/wingman/scripts/dod-pre-push-check.mjs` — the plain-git fallback for
`dod-structural-gate.mjs`'s `git push` checks, built for a harness with no Claude-Code-style
`PreToolUse` hook mechanism at all. Confirms the wrapper produces the same pass/fail outcome as
the Claude Code hook, using the exact same underlying functions, with zero Claude Code involvement
(no stdin JSON tool-call payload, just a plain CLI invocation).

Fully deterministic — no model-judgment component — verified by running the real script against
real fixtures and checking exit codes/output directly, same method as `dod-structural-gate.md`.

## Procedure

1. Build a minimal real git repo directly (`git init`, one commit).
2. Write a `.wingman/checkpoints.jsonl` with a `bundle: "build"` entry, varying `bottom_line`/`seats[].verdict`.
3. Run `node plugins/wingman/scripts/dod-pre-push-check.mjs <fixture-dir>` directly — no stdin, no `tool_name`/`tool_input` wrapper, just the directory argument.
4. Check the exit code and printed message.

## Expectations

| Fixture | Expected exit code | Expected output |
|---|---|---|
| No `.wingman/checkpoints.jsonl` at all | `0` | Message naming "no Build-stage checkpoint recorded yet" — not this project's concern, allowed |
| Clean checkpoint (`bottom_line: "GO"`, all-`GO` seats), no other issues | `0` | "all checks passed" |
| `bottom_line: "DO NOT SHIP"` | `1` | Message naming "blocking verdict" and "bottom line" |
| A seat recorded `NO_GO` with a non-blocking `bottom_line` | `1` | Message naming "blocking verdict" and the specific seat |

## Trust level

`verified` — all 4 shapes ran directly (twice: once during initial development, independently
re-confirmed here) and produced the documented exit code and message text exactly.

## Run log

### Run 1 — 2026-07-15

Built a real git repo, ran all 4 checkpoint shapes above directly against it (no Claude Code, no
stdin JSON — just `node dod-pre-push-check.mjs <dir>`):

- No `.wingman/checkpoints.jsonl` at all → exit `0`, `no Build-stage checkpoint recorded yet — not this check's concern, allowing push.`
- Clean `GO` checkpoint, all-`GO` seats → exit `0`, `all checks passed.`
- `bottom_line: "DO NOT SHIP"` → exit `1`, `the most recent Build-stage Boardroom checkpoint recorded a blocking verdict — its recorded bottom line was "DO NOT SHIP". A checkpoint existing is not the same as it having actually passed.`
- `bottom_line: "GO_WITH_CHANGES"` but one seat (`ciso`) recorded `NO_GO` → exit `1`, `...its "ciso" seat recorded a NO_GO verdict...` — confirming the defense-in-depth seat-level check fires independently of `bottom_line`.

All 4 matched exactly. This confirms the wrapper genuinely reuses `dod-structural-gate.mjs`'s exact
same logic (`checkBoardroomVerdictClean` produced the identical reason strings the Claude Code
hook's own eval, `dod-structural-gate.md`, documents) rather than reimplementing anything — direct
proof the wiring/logic separation this file exists to demonstrate is real, not aspirational.
