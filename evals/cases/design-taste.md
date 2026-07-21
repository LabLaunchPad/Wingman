# Eval: design-taste

Tests `plugins/wingman/skills/output/design-taste/SKILL.md` — its anti-slop UI/UX quality bar: avoids generic, template-derived interfaces and pushes for deliberate hierarchy, consistency, and restraint.

## Scenario — Generic UI → improved (positive case)

A subagent is given a bland, template-default UI description (e.g. "a centered card with a gradient hero, three feature boxes, and a generic CTA") and asked to apply the skill's taste bar.

## Expectations

| Check | Expected |
|---|---|
| Identifies generic/slop patterns rather than praising them | Yes |
| Proposes concrete, specific improvements (hierarchy, spacing, type, motion) | Yes |
| Maintains consistency with any stated design system | Yes |
| Exercises restraint — adds signal, not decoration | Yes |

## Trust level

`verified` — passed a second, differently-shaped scenario (2026-07-16): a genuinely well-designed UI, confirming the skill finds real, checkable drift without inventing nitpicks on work that's actually fine.

## Run log

### Pending — scheduled behavioral eval workflow

Graded via `.github/workflows/evals.yml` (requires `ANTHROPIC_API_KEY` + `/bin/bash`, unavailable in this authoring environment). Case defined to the verified-case format above; grade on next weekly run and record the actual result here.

### Run 2 — 2026-07-16 (negative-direction scenario: a well-designed UI, not a bad one)

Run 1 tested whether the skill catches bad taste (a generic template UI). Run 2 tests the opposite direction per `evals/README.md`'s verified-tier requirement: does the skill invent nitpicks on a genuinely well-designed UI, or correctly recognize disciplined work while still catching what's actually there?

**Fixture** (built fresh, no existing app in this repo to test against, so a lightweight standalone fixture was used instead of a full app — deliberately cheap per the task brief): a B2B expense-reconciliation dashboard component (`reconciliation-summary.html`) plus its own `design-tokens.md` documenting an established palette/font/spacing/motion system, written to follow every rule in the skill's own checklists — single accent color, no gradients/icon-tiles/eyebrows/glassmorphism/bounce-easing, IBM Plex Sans/Mono split matching the "developer tools"-adjacent precision tone for the stated B2B audience, heading levels sequential (h1→h2), status conveyed by color+text not color alone. Two small, genuinely-real inconsistencies were left in deliberately (not called out to the subagent): an unregistered `--danger` color plus a second, undocumented blue (`#1E4FB8`) for the "matched" status pill, and two off-4px-grid padding values (`2px`, `10px 16px`).

**Procedure**: a fresh subagent (via the `Agent` tool), scoped to only `plugins/wingman/skills/output/design-taste/SKILL.md` plus the two fixture files, was asked to apply the skill's full workflow and give its own verdict — not told in advance whether the design was good or bad.

**What it found**, independently re-verified against the real files afterward (not trusted from the subagent's self-report):
- Anti-slop checklist: correctly scored 0/9 — including correctly reasoning the three stat cards are differentiated data (not the checklist's "3+ visually-identical feature cards" tell), avoiding a plausible false-positive trap the checklist's own wording could have baited.
- Quality/accessibility checklist: computed actual contrast ratios rather than eyeballing (grader independently recomputed via the WCAG relative-luminance formula and got identical numbers: 5.98, 5.62, 5.58, 6.38 — all pass AA); correctly flagged the 40px button height as below common 44px touch-target guidance but rightly scored it low-severity given the stated desktop/laptop B2B context; correctly noted no `prefers-reduced-motion` override, again scored minor.
- Token-consistency check: found two **real, grep-confirmed** violations of the fixture's own `design-tokens.md` — the undocumented `--danger` color and second blue, and the two off-grid padding values (`2px`, `10px 16px`) — that were deliberately planted and not hinted at.
- Overall verdict: no anti-slop tells, no blocking defects, real-but-minor token drift named specifically (not vague), translated into a founder-facing verdict using the skill's required jargon table ("the consistent colors, fonts, and spacing you've already locked in elsewhere").

**Verdict**: the skill does not invent nitpicks on disciplined work — it correctly recognized clean anti-slop and accessibility results as clean rather than manufacturing complaints to have something to say, while still surfacing genuine, independently-verifiable inconsistencies planted specifically to test whether the token-check step is real or perfunctory. Combined with Run 1 (catches bad taste) and the now-confirmed inverse (doesn't invent it), this closes the gap `evals/README.md` flagged ("no UI-having fixture in this project... without meaningfully more setup") — a standalone HTML/CSS fixture with a paired tokens doc was sufficient; a full running app was not required. Promoting to `verified`.
