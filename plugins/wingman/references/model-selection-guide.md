# Model Selection Guide — Cross-Skill Reference

Decision framework for choosing which tier of LLM to use for a given task. Optimizes for cost-efficiency while maintaining quality. Every task should be matched to the appropriate tier — using a Tier 0 model for mechanical work wastes money; using a Tier 2 model for architecture risks quality.

---

## 1. Tier Definitions

### Tier 0 — Capable (Highest capability, highest cost)

**Models:** GPT-4o, Claude 3.5/4 Sonnet, Gemini 1.5 Pro, equivalent frontier models

**Use for:**
- Architecture decisions and system design
- Security review and threat modeling
- Final code review before ship
- Complex multi-file refactoring
- Debugging novel, ambiguous issues
- Writing ADRs and technical specifications
- Boardroom seat evaluations

**Characteristics:**
- Strong reasoning across multiple domains
- Handles ambiguity and incomplete context well
- Can hold large context windows without degradation
- Produces nuanced, opinionated output

**Cost:** $$$ per 1M tokens (input + output)

---

### Tier 1 — Standard (Good capability, moderate cost)

**Models:** GPT-4o-mini, Claude 3 Haiku, Gemini 1.5 Flash, equivalent mid-tier models

**Use for:**
- Integration code between known components
- Debugging with clear reproduction steps
- Multi-file changes following established patterns
- Writing tests for well-understood behavior
- Documentation generation
- Code explanation and walkthroughs
- Subagent dispatch for bounded tasks

**Characteristics:**
- Solid reasoning for well-defined problems
- Handles moderate context well
- Good at following patterns and conventions
- May struggle with deep ambiguity or novel problems

**Cost:** $ per 1M tokens

---

### Tier 2 — Cheap (Basic capability, lowest cost)

**Models:** GPT-4o-mini (small context), Gemini Flash (small context), equivalent lightweight models

**Use for:**
- Mechanical code changes (rename, reformat, move)
- Single-file edits with clear instructions
- Documentation updates and typo fixes
- Simple test generation from templates
- Linting and formatting assistance
- Boilerplate generation
- Simple search and extraction tasks

**Characteristics:**
- Reliable for pattern-matching tasks
- Fast response times
- Handles simple, single-step operations well
- May hallucinate on complex reasoning

**Cost:** $ per 1M tokens

---

## 2. Cost Warnings

### Turn count beats token price

The most expensive model is the one that requires 10 turns to fix what a capable model would solve in 2. Calculate total cost, not per-token cost.

```
Scenario A: Tier 2 model, 10 turns, 50K tokens = $0.50 + 10x latency + risk of wrong output
Scenario B: Tier 0 model, 2 turns, 20K tokens = $1.20 + 2x latency + high confidence

Winner: Scenario B (cheaper overall, faster, more reliable)
```

### Escalation cost

Starting with a cheap model and escalating to a capable model after failure is always more expensive than starting with the right tier. Match the tier to the task complexity first.

### Context window waste

Sending large codebases to a Tier 2 model that can only handle 8K tokens means truncation, retries, and wasted tokens. Right-size the model to the context required.

### Parallel fan-out math

```
5 parallel Tier 0 subagents = 5x cost of sequential Tier 0
5 parallel Tier 2 subagents = 5x cost of sequential Tier 2

If tasks are truly independent and the total token count is bounded,
parallel Tier 2 can be cheaper than sequential Tier 1.
```

---

## 3. Task Complexity Signals

Use these signals to determine which tier a task needs.

### High complexity (Tier 0)

- Task touches 3+ files with interdependencies
- Security, auth, or data integrity implications
- No clear right answer — tradeoffs involved
- Requires understanding of business context
- Debugging with no clear reproduction
- Architectural decisions that are hard to reverse
- Final review before shipping to production

### Medium complexity (Tier 1)

- Task touches 1-3 files with clear scope
- Following established patterns in the codebase
- Writing tests for well-understood behavior
- Integration between known components
- Debugging with clear reproduction steps
- Documentation for existing code

### Low complexity (Tier 2)

- Single-file changes with explicit instructions
- Mechanical refactoring (rename, extract, move)
- Template-based generation
- Formatting and linting fixes
- Simple CRUD operations following existing patterns
- Typo fixes and documentation updates

---

## 4. Tier Selection Decision Tree

```
Does the task require judgment, ambiguity resolution, or cross-domain reasoning?
  YES -> Tier 0
  NO  |
       v
Does the task touch multiple files with dependencies?
  YES -> Tier 1
  NO  |
       v
Does the task require understanding the codebase context?
  YES -> Tier 1
  NO  |
       v
Is the task mechanical, templated, or single-file?
  YES -> Tier 2
  NO  -> Reassess — may need Tier 0 or 1
```

---

## 5. Tier Assignment by Boardroom Role

| Role | Default Tier | Reasoning |
|------|-------------|-----------|
| Founder | Tier 0 | Business/product judgment requires capable reasoning |
| Engineer | Tier 0 or 1 | Depends on task complexity (use decision tree) |
| Security | Tier 0 | Security review requires strongest reasoning |
| Design | Tier 1 | UI/accessibility patterns are well-defined |
| Cost | Tier 1 | Cost analysis follows established patterns |

### Override rules

- **Engineer seat** can downgrade to Tier 2 for mechanical subtasks
- **Security seat** must use Tier 0 for any security review — no exceptions
- **Founder seat** must use Tier 0 for any strategic decision — no exceptions
- Any seat can escalate to Tier 0 at any time if the task proves more complex than expected

---

## 6. Practical Examples

| Task | Tier | Reasoning |
|------|------|-----------|
| Rename a variable across 3 files | Tier 2 | Mechanical, clear scope |
| Write unit tests for a pure function | Tier 2 | Pattern-based, single file |
| Fix a bug with clear repro steps | Tier 1 | Moderate reasoning needed |
| Implement a new API endpoint | Tier 1 | Multi-file, follows patterns |
| Design a database schema | Tier 0 | Architectural, hard to reverse |
| Review a PR for security issues | Tier 0 | Requires strongest reasoning |
| Write an ADR for a design choice | Tier 0 | Cross-domain judgment needed |
| Update README with new setup steps | Tier 2 | Mechanical documentation |
| Debug a race condition | Tier 0 | Novel, ambiguous, requires deep reasoning |
| Generate boilerplate for a new module | Tier 2 | Template-based, mechanical |
| Refactor a module to use a new pattern | Tier 1 | Multi-file but follows established pattern |
| Evaluate tradeoffs between 2 approaches | Tier 0 | Requires nuanced judgment |

---

## 7. Cost Tracking

### Per-task cost estimation

Before dispatching a subagent, estimate:

```
Estimated input tokens:  ~X
Estimated output tokens: ~Y
Model tier:              Tier Z
Estimated cost:          (X + Y) * tier_rate
```

### Cost thresholds

| Threshold | Action |
|-----------|--------|
| < $0.10 | No approval needed |
| $0.10 - $1.00 | Log in task notes |
| $1.00 - $5.00 | Flag in Boardroom checkpoint |
| > $5.00 | Requires founder approval |

### Optimization strategies

1. **Right-size the tier.** Don't use Tier 0 for mechanical work.
2. **Right-size the context.** Only send what's needed, not the entire codebase.
3. **Batch similar tasks.** One prompt that handles 3 renames is cheaper than 3 separate prompts.
4. **Cache patterns.** If you solve a problem once, document the pattern for Tier 2 to follow.
5. **Prefer turn efficiency over token cheapness.** Fewer turns with a capable model often costs less than many turns with a cheap one.

---

## Application Rules

1. **Every subagent dispatch** must declare which tier it uses and why.
2. **Cost seat** tracks actual spend against estimates in the Boardroom checkpoint.
3. Tier selection is auditable — it appears in the task log.
4. Using Tier 0 for mechanical work is flagged as waste; using Tier 2 for security review is flagged as risk.
5. This document is versioned. Changes require a Boardroom checkpoint with the Cost seat.

## Cited by

- `plugins/wingman/skills/discipline/subagent-driven-development/SKILL.md`
