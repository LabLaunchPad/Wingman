# The fablize wiring/logic separation pattern

Referenced by `docs/ARCHITECTURE.md` §8a. Not a vendored dependency (nothing from this source is
copied or executed) — a documented design principle reverse-engineered from a real, working Claude
Code plugin, `github.com/fivetaku/fablize`, in response to a direct request to make Wingman's own
hook layer more agent-agnostic. See `ATTRIBUTIONS.md` for the formal attribution entry.

## What fablize actually does

fablize makes Claude Opus follow the same verification discipline as a stronger model (Fable), via
4 hooks wired through `hooks.json` onto Claude Code's own event taxonomy (`UserPromptSubmit`,
`PostToolUse`, `Stop`):

- `router.sh` — reads the user's prompt text from stdin JSON, pattern-matches it against keyword
  categories (debugging signals, render/executable signals), and injects the matching discipline
  context. Routes on the smallest matching category, never multi-routes unless genuinely
  multi-category, and always exits 0.
- `gate_post_tool.py` — after a `Bash`/`Edit`/`Write`/`NotebookEdit`/`MultiEdit` call, records
  whether files changed, whether a verification command ran, and whether the tool call failed
  (with repeat-failure detection across turns).
- `gate_stop.py` — blocks session completion when the turn's own ledger shows file changes with no
  observed successful verification, up to a bounded threshold before it degrades to a warning
  instead of a hard block (a fail-open design on unhandled errors, by explicit choice).

## The one principle worth reusing

**None of fablize's actual decision logic branches on a Claude-Code-specific tool name.** `router.sh`
matches prompt *content*; `gate_post_tool.py` and `gate_stop.py` operate on file paths, command
text, and exit codes read from a generic JSON payload. The *only* Claude-Code-specific part of the
whole system is `hooks.json`'s wiring — which event name fires which script. fablize is not
"portable" at the wiring layer any more than Wingman is (it depends on Claude Code's own hook
taxonomy too); the actual, transferable lesson is the **discipline**, not a portability trick:

> Keep the harness-specific wiring (which event triggers which script) as thin and isolated as
> possible. Write every script's internal decision logic against generic signals — file content,
> command text, exit codes, structured state — never a specific tool name, wherever a generic
> signal would work equally well. That discipline is what lets the same logic be re-wired under a
> different harness's own hook mechanism (or no hook mechanism at all — just a plain script) later,
> without touching the logic itself.

## Where this was applied in Wingman

Re-reading `plugins/wingman/hooks/dod-structural-gate.mjs` against this exact standard (see
`docs/ARCHITECTURE.md` §8a) found it **already follows this discipline** — every exported check
function operates on generic signals; only the file's outermost `if (toolName === ...)` dispatch is
tool-name-specific, and that's wiring, not logic, exactly like `router.sh`'s own event dispatch.

The one concrete gap this exposed: that generic logic had no invocation path outside Claude Code's
own `hooks.json` at all. `plugins/wingman/scripts/dod-pre-push-check.mjs` closes it — a plain CLI
wrapper, runnable as a real git `pre-push` hook or from any harness with shell access, that imports
and calls the exact same exported functions. No new decision logic was written; this is pure reuse,
which is the whole point of the discipline above.
