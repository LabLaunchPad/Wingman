# Wingman Research Matrix

The research-first half of the AI Engineering Operating System build (`docs/status/ARCHITECTURE.md`
§8g) — the method side of the founder's philosophy: *"Observe deeply. Reverse engineer
systematically. Understand first principles. Recombine into something genuinely better."*

**Dev-repo-only, like `docs/`, `evals/`, and `tests/` — never ships with the plugin.** This is a
research trail for Wingman's own maintainers, not founder-facing content
(`plugins/wingman/AGENTS.md`'s "docs/ isn't installed" rule applies equally here).

## The rule

**Before building a new capability, study it. Don't build first and research after.**
`skills/research-gate` enforces this as a real gate: a module with no completed research folder
blocks at the architecture step, naming which of the 5 studies is missing.

## Structure

13 domain folders, each holding one `TRUTH-<capability>.md` per capability actually studied —
never a folder created "to be thorough" ahead of a real capability needing it
(`references/constitution.md` rule 3, and the same evidence-gate this project already applies to
specialist roles and department leads).

```
research/
├── 01-agent-runtime/
├── 02-context-engineering/
├── 03-memory/
├── 04-orchestration/
├── 05-ux-intelligence/
├── 06-design-systems/
├── 07-knowledge-graphs/
├── 08-evaluation/
├── 09-security/
├── 10-governance/
├── 11-devtools/
├── 12-platform-engineering/
└── 13-ai-sdlc/
```

## The 5-study framework

Every `TRUTH-*.md` document studies exactly these 5 things before recording a design decision —
`template-truth-doc.md` is the locked shape:

1. **The pioneers** — who introduced the idea, concretely named.
2. **Current best implementations** — who does it best today, with real evidence (a fetched repo,
   a read doc), never assumed from a name.
3. **Community experience** — recurring complaints, workarounds, feature requests — often the real
   signal, not the success-story framing.
4. **Engineering trade-offs** — why this design, what alternatives existed, why they were rejected.
5. **Our synthesis** — Our Principle / Our Architecture / Our Improvements / What We Will Not Do /
   Open Questions. Never skipped to reach implementation faster.

## What's populated, honestly

Two domains already have real content, because Wingman just built the capabilities they cover and
the research trail exists as a record of what was actually checked, not retrofitted:

- **`02-context-engineering/TRUTH-context-engine.md`** — the Context Engine built in PR 4.
- **`03-memory/TRUTH-memory-tiers.md`** — the 7-tier Memory Engine built in PR 5.

The other 11 domains are **structure only** — a `README.md` stating the domain's scope, no
fabricated "pioneers" or invented prior-art claims. Populating them with real research is
evidence-gated the same way a new specialist role is: only when a real capability in that domain is
about to be built, never speculatively ahead of that need. Filling all 13 with generic research to
look complete would be the exact premature-completionism this project's own culture declines
elsewhere.

## Referenced by

- `skills/research-gate` — the gate that gives this structure a mechanical consumer.
- `docs/status/ARCHITECTURE.md` §8g.
