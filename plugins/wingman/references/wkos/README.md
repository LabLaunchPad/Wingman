# WKOS — the Wingman Knowledge Operating System

The document contract every Wingman project produces. Same structure in every project, so an agent
reasoning about an unfamiliar codebase can navigate it without being told where anything is.

## The one rule that makes this work

**Every document here has a real producer and a real consumer, or it is a template.**

That is not a style preference — it is the specific test a previous ~60-file governance blueprint
failed. It was cut down to 10 files after an audit found "the blueprint's files have zero consumer…
dead weight on creation" (`docs/PROJECT.md`, 2026-07-22), directly violating
`skills/evidence-gated-catalog`'s no-speculative-bulk-creation rule.

WKOS avoids that fate by being **the output contract of machinery that already exists**, not a
scaffold created empty and hoped into. Concretely:

- **Produced today** — a pipeline stage, skill, or hook already writes it. Listed with its producer
  in `producer-map.md`. These are real.
- **Template only** — nothing produces it yet. It lives in `templates/` as a scaffold a founder or a
  future stage can fill. **It is never created as an empty file in a founder's repo.**

`scripts/validate-wkos.mjs` asserts this mechanically. A document that appears in the shipped
structure with no named producer and no template is an error, not a warning — because that is
exactly the state that turns a knowledge system into dead weight.

## What this is not

- **Not a second source of truth.** Where a document already exists under another name — Wingman's
  own `docs/status/ARCHITECTURE.md`, `PRD.md`, `SRS.md`, `DATABASE.md`, `GOVERNANCE.md` — WKOS names
  the existing file rather than creating a parallel one. Two files for one concept is the drift bug
  `references/constitution.md` rule 3 forbids.
- **Not a required 130-file checkout.** A founder's project grows the documents its stages actually
  produce. A landing page will never have a `MIGRATIONS.md`, and that absence is correct, not a gap.
- **Not a replacement for the traceability chain.** WKOS's `Parents`/`Children`/`References` metadata
  is the *document-level* view of the same graph `check-traceability.mjs` already walks at the ID
  level. It reuses that engine; it does not introduce a second one.

## The Golden Rule

Every document answers three questions, and each maps to something already mechanical:

| Question | What answers it | Where it's enforced |
|---|---|---|
| **Why does this exist?** | Business intent — the `DISC-*` finding it descends from | `commands/pipeline/discovery.md` mints the chain root |
| **How does it connect?** | The `Satisfies` chain and the document graph | `scripts/check-traceability.mjs --chain` |
| **How do we know it's correct?** | Acceptance criteria | `skills/acceptance-criteria` |

A document that cannot answer all three is not finished.

## Layout

Numbered so the order is the lifecycle order, and so an agent scanning a directory listing reads
them in the sequence they are produced.

```
wingman-docs/
├── 00-governance/     policy, risk, approval, audit
├── 01-discovery/      vision, problem, research, personas, jobs
├── 02-product/        PRD, MVP scope, roadmap, releases
├── 03-requirements/   SRS, functional/non-functional, acceptance, traceability
├── 04-ux/             IA, flows, journeys, wireframes, accessibility
├── 05-design-system/  principles, tokens, components, motion, responsive
├── 06-architecture/   system context, domain model, C4, deployment, security, scaling
├── 07-decisions/      ADRs, RFCs, trade-offs, decision log
├── 08-data/           data model, schema, migrations, retention, memory, knowledge graph
├── 09-api/            overview, auth, errors, versioning, webhooks
├── 10-engineering/    standards, dependencies, testing, workflow, release
├── 11-ai/             agent/context/memory/knowledge engines, orchestration, evaluation
├── 12-quality/        QA, tests, audits, scorecard
├── 13-operations/     runbooks, incidents, backup, monitoring, cost
├── 14-learning/       retros, lessons, failure/success libraries, benchmarks
└── templates/         scaffolds for documents nothing produces yet
```

See `producer-map.md` for which of these are produced today and by what, and
`document-template.md` for the metadata block and section order every document follows.

## Referenced by

- `references/constitution.md` — rule 9 (memory after outcome) and rule 10 (consistency).
- `scripts/validate-wkos.mjs` — the mechanical check behind the one rule above.
