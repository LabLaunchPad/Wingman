# Eval: platform-native-reference

Tests `plugins/wingman/skills/platform-native-reference/SKILL.md` — its cross-layer reference mapping "what you think you need" to "what the platform ships" — against scenarios where native solutions exist.

## Scenario 1 — Dependency that platform already provides (positive case)

A request to add a date picker library when `<input type="date">` exists natively.

## Expectations

| Check | Expected |
|---|---|
| Correctly identifies native HTML element | Yes — `<input type="date">` |
| Correctly identifies native CSS capability | Yes — responsive font size via clamp() |
| Correctly identifies native JS API | Yes — structuredClone, Intl.NumberFormat |
| Correctly identifies native Node.js stdlib | Yes — fs.mkdirSync with recursive |
| Recommends native over dependency | Yes — install only when native is insufficient |

## Trust level

`authored, pending first run` — Scenario 1 above is specified but has no run log; do not treat as `verified` until a real run is logged (see `evals/README.md`).
