# Demo/Screenshot Checklist

Wingman has never been installed and run as a real Claude Code plugin — every eval in `evals/` ran against throwaway fixtures in a sandbox, with workarounds for things a real install doesn't need (simulated `AskUserQuestion` answers, general-purpose agents standing in for named `dept-*`/`boardroom-*` subagent types). This checklist exists so that whoever does the real install can capture useful demo content efficiently, instead of guessing what's worth showing. Claude Code itself can't produce this — it requires a real install and a human at the keyboard.

## Before you start

1. Install Wingman as a real plugin (add the marketplace, install `wingman`) in a real or realistic project — doesn't need to be complex; a small app with 1-2 real features is enough to make the Boardroom's output feel concrete rather than abstract.
2. Have something worth planning: a real feature request, in your own words, the way you'd actually ask for it.

## What to capture, in priority order

1. **A full `/wingman:plan` → Boardroom checkpoint cycle.** This is the core promise (plain-language checkpoints instead of code review) — capture the founder-facing consolidated summary specifically (the `## Bottom line` / `## What each seat said` / `## If you want to ship this` structure from `commands/adaptive/boardroom.md`), not the raw plan document. This is the single most important screenshot: it's what a founder actually sees.
2. **A `GO_WITH_CHANGES` or `NO_GO` outcome, not just a clean `GO`.** A demo that only ever shows "everything's fine" doesn't demonstrate the thing that matters most — that Wingman actually stops you before something bad ships. If your first real run comes back clean, that's good news for your project but not a demo; consider a second run with something genuinely worth flagging (a missing test, a vague scope) to capture this.
3. **A department lead getting created**, with the one-sentence plain-language notice Wingman gives when this happens (e.g. "Since this touches customer payments, I've added a Legal & Security lead to your project's team going forward.") — this shows the lazy-growth model working, not just being described.
4. **The `/wingman:secure` gate closing a real risk** — either a fixed vulnerability or a founder-accepted-risk decision landing in `docs/wingman/founder-todos.md`. Whichever happens naturally in your real project is fine; don't force one.
5. **The full pipeline's plain-language completion messages** (`plan.md`/`build.md`/`secure.md`/`ship.md` each have a founder-facing report template) — a short sequence showing the founder-visible surface end to end, without the technical detail underneath.

## What NOT to bother capturing

- Raw technical output, diffs, or anything a founder wouldn't actually see — Wingman's whole point is that founders don't need to read this.
- A contrived "perfect" run with zero findings anywhere — see point 2 above.
- Internal department-lead-to-department-lead or subagent tool-call chatter — not founder-facing, not representative of the product.

## Format

Screenshots (terminal or IDE, whichever you actually use Claude Code in) are enough — a short screen recording is a bonus but not required. Save captures under `docs/assets/` (create it) with descriptive filenames (e.g. `boardroom-checkpoint-go-with-changes.png`), and reference them from `README.md` once captured.
