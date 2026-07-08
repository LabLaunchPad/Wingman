---
name: design-taste
description: Use when building, reviewing, or critiquing any user-facing interface during /wingman:build — landing pages, dashboards, forms, app shells, components. Also the reference skill boardroom-design draws on when reviewing UI work at a checkpoint. Triggers on visual/UX work, "make this look better," or a founder asking why a design looks generic.
---

<!--
Merged and adapted from three vendored skills — all MIT/Apache-2.0
licensed, see /ATTRIBUTIONS.md for exact provenance:
- Leonxlnx/taste-skill (MIT) — the countable/checkable rule discipline
  and the "route to an official design system first" instinct.
- pbakaus/impeccable (Apache-2.0) — the slop-vs-quality/accessibility
  category split, and the idea of checking against a project's own
  established tokens rather than re-deciding them each time.
- nextlevelbuilder/ui-ux-pro-max-skill (MIT) — the product-type to
  palette/font mapping, condensed to a lightweight table instead of the
  full upstream CSV database.
Deliberately excluded: ui-ux-pro-max's banner-design sub-skill (requires
a paid Gemini image-generation API) and impeccable's browser
extension/live-overlay server (real running infrastructure) — neither
fits a markdown-only Claude Code plugin. See vendor research notes.
-->

# Design Taste

## Overview

AI-generated interfaces converge on the same "tells" regardless of which model wrote them — generic gradients, identical three-card layouts, decorative icon tiles nobody asked for. This skill exists to catch that convergence before it ships, and to translate the finding into something a non-technical founder can act on without knowing what "glassmorphism" means.

**Core principle:** check against a real, named category of problem (a specific "tell," a specific accessibility failure, a specific inconsistency with what's already built) — never a vague "make it better."

## When To Use

Building or reviewing anything with a user-facing surface: landing pages, dashboards, forms, app shells, onboarding, empty/error states, individual components. Also used by `boardroom-design` when rendering its checkpoint verdict.

## Core Workflow

**1. Read the room first.** Before generating or judging anything, state in one line what kind of product this is and who it's for (e.g. "a B2B analytics dashboard for accountants" vs. "a consumer wellness app") — the right design answer differs by context, and this skill should never apply one aesthetic universally.

**2. Prefer an official design system over inventing one.** If the project already uses (or should use) an established system — Material, Fluent, shadcn, GOV.UK, or similar — route there first rather than hand-rolling tokens. Reinventing color/spacing/type systems from scratch is where most "AI slop" tells originate.

**3. Check against the project's own established tokens, if any exist.** If this project has prior design decisions (an existing palette, font, spacing scale), new work must match them — flag drift explicitly rather than silently introducing a second visual language.

**4. Run the anti-slop checklist** (category: **slop** — a generic "AI tell," not necessarily broken, but recognizable and cheap-looking):
- Purple/cyan gradient backgrounds or gradient text used as a default, not a deliberate brand choice
- Decorative icon tiles stacked above headings with no functional purpose
- Small uppercase "eyebrow" labels used reflexively above every section heading
- Three (or more) visually-identical feature cards with no real differentiation
- Glassmorphism/neumorphism applied as a default aesthetic rather than a deliberate choice
- Side-stripe accent borders on cards as a default decoration
- Bounce/elastic easing on every transition
- Overused default fonts (Inter, or whichever font is the current generic default) with no typographic point of view
- Em-dash overuse or other reflexively "AI-sounding" copy patterns

**5. Run the quality/accessibility checklist** (category: **quality** — a real defect, not just a stylistic tell):
- Text contrast below accessibility minimums (roughly: normal text needs strong contrast against its background; if it's hard to read on a bright phone screen outdoors, it fails)
- Touch targets too small to tap reliably on a phone
- Text too small to read comfortably
- Heading levels skipped (e.g. jumping from a top-level heading straight to a minor one, breaking screen-reader navigation)
- Justified body text (creates uneven word spacing, hurts readability)
- Motion that can't be reduced for users sensitive to it

**6. Use the lightweight product-type reference table below** as a starting point for palette/tone, not a rigid prescription — override it whenever the project's own brand/tokens (step 3) say otherwise:

| Product type | Typical palette mood | Typical tone |
|---|---|---|
| B2B / enterprise / dashboards | Restrained, neutral base + one accent color | Precise, low-decoration |
| Consumer / lifestyle / wellness | Warmer, higher color variety | Friendly, more motion acceptable |
| Fintech / trust-sensitive | Cool, high-contrast, minimal decoration | Serious, conservative |
| Developer tools | Dark-mode-first, monospace accents | Direct, dense information acceptable |

## Constraints

**MUST:**
- State the product type/audience before making any design judgment.
- Check new work against the project's own existing tokens before introducing new ones.
- Translate every finding for `boardroom-design`'s founder-facing verdict — see the jargon table below.

**MUST NOT:**
- Apply a single "one true aesthetic" regardless of product context.
- Report a finding to the founder using unexplained jargon (see translation table).
- Assume a generative image API or any paid third-party service is available — if visual asset generation would help, ask before assuming the tool exists.

## Rationalizations

| Excuse | Reality |
|---|---|
| "It matches what's trendy right now" | Trendy and generic are often the same thing — check it against the anti-slop list regardless of how current it looks. |
| "It's just a placeholder, doesn't need real review" | Placeholders ship more often than intended — apply the quality/accessibility checklist even to "temporary" UI. |
| "The founder won't notice this detail" | The founder may not name the problem, but users will feel it (hard-to-read text, cheap-looking layout) — that's exactly what this skill exists to catch on their behalf. |

## Red Flags — Stop and Reconsider

- You're about to ship a design with 3+ items from the anti-slop checklist present.
- You're about to ship any item from the quality/accessibility checklist — these are defects, not taste calls, and should block rather than just get noted.
- You're introducing a new color/font/spacing decision without checking whether the project already has one.

## Verification

Before calling UI work done, walk through both checklists explicitly and name which items were checked, not just conclude "looks good." For accessibility items specifically, this should be an actual check (e.g. read the text size/contrast values used), not a visual impression.

## Founder-Facing Translation (required for boardroom-design)

Never surface these terms directly in a checkpoint verdict — translate to consequence:

| Jargon | Say instead |
|---|---|
| Fails WCAG contrast | "Some text will be hard to read, especially for users with low vision or in bright light — this is also an accessibility-lawsuit risk." |
| Glassmorphism / neumorphism / brutalism | "A specific visual style choice" (name what it looks like in plain terms, only if relevant to the decision at hand) |
| Design tokens / design system | "The consistent colors, fonts, and spacing rules for your product" |
| Core Web Vitals / CLS / LCP | "How fast and stable the page feels to load and use" |
| ARIA labels / screen-reader support | "Whether people using accessibility tools (like screen readers) can actually use this" |
| ai-color-palette / generic gradient | "A generic look that doesn't say anything distinctive about your brand" |

## Output

No fixed template for build-time use. For `boardroom-design`'s checkpoint verdict, findings feed directly into that agent's existing `## DESIGN VERDICT` block (see `agents/boardroom-design.md`) — this skill supplies the checklist and translation table that verdict is built from.
