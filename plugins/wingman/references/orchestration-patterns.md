# Orchestration Patterns — Cross-Skill Reference

Decision framework for how to coordinate multi-step work. Used by the Engineer and Founder seats when planning task execution. Every plan must declare which pattern it uses and why.

---

## 1. Decision Flowchart

```
Is the task a single file, single concern?
  YES -> Direct execution (no orchestration needed)
  NO  |
       v
Does the task have independent subtasks?
  YES -> Can subtasks run without shared state?
    YES -> Parallel dispatch
    NO  -> Sequential pipeline
  NO  |
       v
Is the task a decision with multiple valid approaches?
  YES -> Council (4-voice evaluation)
  NO  |
       v
Does the task touch security, auth, or data integrity?
  YES -> Boardroom checkpoint required
  NO  |
       v
Is the task a build/verify cycle with clear steps?
  YES -> Sequential pipeline
  NO  -> Reassess: may need planning first
```

---

## 2. Five Endorsed Patterns

### Pattern 1: Direct Execution

**When:** Single file, single concern, low complexity.
**How:** One agent, one pass, done.

```
Task -> Agent -> Verify -> Done
```

**Use when:**
- Fixing a typo, renaming a variable, updating a config value
- Single-file changes with clear scope
- Quick fixes with obvious solutions

**Skip when:**
- Task touches 3+ files
- Task has security implications
- Task requires architectural decisions

---

### Pattern 2: Sequential Pipeline

**When:** Task has dependent steps where each step's output feeds the next.
**How:** Steps executed in order; each step verified before the next.

```
Step 1 -> Verify -> Step 2 -> Verify -> Step 3 -> Verify -> Done
```

**Use when:**
- Database migration + code update + test update
- Build step + deploy step + verification step
- Research -> Plan -> Implement -> Review

**Rules:**
- Every step must pass its verification gate before the next step starts
- If any step fails, halt and diagnose — don't skip
- Each step should produce a visible artifact (output, file, log)

---

### Pattern 3: Parallel Dispatch

**When:** Subtasks are independent and can run without shared state.
**How:** Subtasks dispatched simultaneously; results merged.

```
         +-> Subtask A -> Verify -+
Task --->|-> Subtask B -> Verify -+--> Merge -> Verify -> Done
         +-> Subtask C -> Verify -+
```

**Use when:**
- Multiple files need similar but independent changes
- Multiple test suites can run in parallel
- Research across multiple independent sources

**Rules:**
- Subtasks must not write to the same files
- Subtasks must not depend on each other's outputs
- Use `/worktree` for filesystem isolation when subtasks might conflict
- Bound fan-out: max parallel subtasks = 5 (beyond this, coordination cost exceeds benefit)
- Every subtask produces a result that the merge step can consume

---

### Pattern 4: Council (4-Voice Evaluation)

**When:** A decision has multiple valid approaches with tradeoffs.
**How:** Four distinct perspectives evaluate options independently, then synthesize.

```
Decision -> Founder perspective  -+
           Engineer perspective -+--> Synthesis -> Decision
           Security perspective -+
           Design perspective   -+
```

**Use when:**
- Choosing between valid architectural approaches
- Evaluating tradeoffs (performance vs. simplicity vs. security)
- Ambiguous requirements that could go multiple directions

**Rules:**
- Each voice must argue from its own expertise, not echo others
- The synthesis must acknowledge all perspectives, not just the loudest
- Decision is recorded with rationale (ADR or equivalent)
- Council is for decisions, not for implementation

---

### Pattern 5: Boardroom Checkpoint

**When:** Task touches security, auth, data integrity, public API, or has cross-cutting concerns.
**How:** 5-seat parallel review before proceeding.

```
Task -> 5 seats evaluate in parallel -> Bottom line decision -> Proceed or Block
         |            |            |            |            |
      Founder    Engineer    Security     Design       Cost
```

**Use when:**
- Any security-sensitive change
- Changes to authentication or authorization
- Database schema changes
- Public API changes
- Ship-readiness assessment
- High-risk or high-impact decisions

**Rules:**
- All 5 seats must return a verdict (GO or NO_GO with reasoning)
- If ANY seat returns NO_GO, the bottom line is **DO NOT SHIP**
- Founder has final say on priority conflicts, not on security overrides
- Boardroom is a checkpoint, not a veto — it produces a decision, not endless debate

---

## 3. Four Anti-Patterns

### Anti-Pattern 1: Shotgun Debugging

**What:** Randomly changing code hoping to fix a problem without understanding root cause.
**Why it's bad:** Introduces regressions, wastes tokens, produces unmaintainable fixes.
**Instead:** Use systematic debugging (reproduce -> minimize -> hypothesize -> instrument -> fix -> regression-test).

---

### Anti-Pattern 2: Premature Parallelization

**What:** Running subtasks in parallel before understanding dependencies.
**Why it's bad:** Merge conflicts, inconsistent state, wasted work when one subtask invalidates another.
**Instead:** Map dependencies first. Only parallelize truly independent work. Use sequential for anything with shared state.

---

### Anti-Pattern 3: Council of Everything

**What:** Running a full 5-seat Boardroom for every minor decision.
**Why it's bad:** Slow, expensive, desensitizing (people start ignoring checkpoints).
**Instead:** Use the decision flowchart. Direct execution for trivial changes. Council for decisions. Boardroom for high-stakes.

---

### Anti-Pattern 4: Orchestration Theater

**What:** Using elaborate orchestration for tasks that don't need it, creating the appearance of rigor without substance.
**Why it's bad:** Adds overhead, slows delivery, produces documentation nobody reads.
**Instead:** Match orchestration complexity to task complexity. A rename doesn't need a pipeline. A security change does.

---

## 4. When NOT to Automate

Automation is not always the right answer. Recognize these situations:

| Situation | Why not automate | What to do instead |
|-----------|-----------------|-------------------|
| Exploratory research | Unknown unknowns require human judgment | Manual investigation with note-taking |
| Architectural decisions | Tradeoffs are context-dependent, not algorithmic | Council or Boardroom discussion |
| Creative design | Aesthetic judgment is subjective and iterative | Human-driven with tool assistance |
| Stakeholder communication | Tone, context, and politics require human nuance | Human-written, optionally drafted by AI |
| One-off tasks | ROI of automation exceeds task cost | Manual execution |
| Novel debugging | Root cause unknown; exploration needed first | Systematic debugging skill, not automation |

**Rule of thumb:** If the task requires understanding intent, navigating ambiguity, or making a judgment call, automate the mechanical parts and keep the decisions human.

---

## 5. Boardroom vs Council vs Parallel Dispatch

| Aspect | Boardroom | Council | Parallel Dispatch |
|--------|-----------|---------|-------------------|
| **Purpose** | Ship-readiness gate | Decision evaluation | Task execution |
| **Participants** | 5 fixed seats | 4 voices (configurable) | Subagents |
| **Output** | GO/NO_GO verdict | Recommendation + rationale | Completed subtasks |
| **When to use** | High-stakes, security, ship decisions | Ambiguous tradeoffs | Independent subtasks |
| **Blocking?** | Yes — NO_GO blocks shipping | Advisory — informs decision | No — results merged |
| **Cost** | High (5 seats) | Medium (4 voices) | Variable (depends on fan-out) |

**Selection guide:**
- Need a decision? -> Council
- Need permission to ship? -> Boardroom
- Need to get work done in parallel? -> Parallel Dispatch
- Need all three? -> Parallel Dispatch first, then Council for decisions, then Boardroom for ship gate

---

## Application Rules

1. **Every plan** must declare which orchestration pattern(s) it uses and why.
2. **Engineer seat** owns pattern selection for implementation tasks.
3. **Founder seat** owns pattern selection for strategic decisions.
4. Pattern selection is auditable — it appears in the plan document.
5. This document is versioned. Changes require a Boardroom checkpoint.
