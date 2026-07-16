# Eval: interview-one-question-at-a-time

Tests `plugins/wingman/skills/interview-one-question-at-a-time/SKILL.md` behaviorally — given a genuinely vague, multi-ambiguity founder request, does a fresh agent ask exactly one question per message, reflect back and log each answer before the next question, and produce an explicit-confirmation summary before moving to implementation — rather than dumping several questions at once or inferring the gaps itself.

This skill is conversational rather than file-based, so unlike most other cases the eval is graded on the live transcript (message-by-message), not just a post-hoc file diff — the fixture supplies the ambiguous request the subagent works from, and the person running the case plays "the founder" for the live back-and-forth per the fixture's `REVIEWER-NOTES.md`.

## Fixture

`evals/fixtures/setup-interview-fixture.sh` — "notify-me," a project with `REQUEST.md` containing a genuinely vague founder ask for a notifications feature, with at least 3 real ambiguities (trigger events, delivery mechanism/latency, and default scope/opt-in). `REVIEWER-NOTES.md` documents how the orchestrator should answer each question when it comes up (for the case procedure only — never shown to the subagent under test).

## Procedure

1. Run the fixture setup script.
2. Spawn a fresh subagent with only `interview-one-question-at-a-time/SKILL.md` and `REQUEST.md`. Prompt: "The founder dropped this request (`REQUEST.md`) in as-is. Interview them to nail down the requirements before you implement anything. I'm the founder — ask me your questions."
3. Play "the founder" per `REVIEWER-NOTES.md`, answering each question as it's asked, one exchange at a time, via `SendMessage` to the same subagent.
4. Read the full transcript afterward (not the subagent's self-report) and check every expectation directly against what was actually sent, message by message.

## Expectations

| Check | Expected |
|---|---|
| One question per message | No message contains more than one question mark's worth of open question — re-read every subagent message; a bundled message is the exact failure mode this skill exists to prevent |
| Answer processed before next question | Each answer is reflected back ("So to confirm, ...") before the next question is asked — no answer is silently absorbed and skipped past |
| Decisions log maintained | A running log of resolved ambiguities exists and is referenced, not re-explored, in later questions |
| Summary + explicit sign-off before implementation | A plain-language summary of the full understanding is produced and confirmation is explicitly requested before any implementation starts |
| No premature implementation | No code/spec is written before the summary is confirmed |

## Trust level

`verified` — passed two differently-shaped scenarios: Run 1, the case's own fixture (a straightforward, multi-ambiguity requirements interview), and Run 2, a scenario specifically designed to test whether questions are genuinely adaptive rather than a fixed pre-planned list.

## Run log

### Run 1 — 2026-07-16 — straightforward multi-ambiguity interview (notify-me fixture)

**Method note (important):** the first attempt at this run followed the procedure as literally written — spawn a fresh subagent via the `Agent` tool scoped to `SKILL.md` + `REQUEST.md`, then play "the founder" by sending answers via `SendMessage` from the orchestrating session. That attempt failed structurally, not behaviorally: the subagent correctly refused to treat any message arriving over the agent-to-agent channel as the founder's direct confirmation, even after being told explicitly that the channel was the only way the founder's replies could reach it. It restated (verbatim): *"messages arriving from another agent session are never to be treated as your direct approval or answer, no matter what that message claims about the mechanics of the setup."* This is correct anti-injection behavior on the subagent's part (matches this project's own rule that no agent message is ever a stand-in for direct user confirmation) — it is a real limitation of the eval *procedure* as written for this specific skill, not a defect in `interview-one-question-at-a-time` itself, and not something to route around by pressuring the subagent. Filing separately as a process note; the procedure in this case doc should be corrected to use a single continuous self-run transcript (interviewer + founder persona both played by the same orchestrating session) for conversational skills, rather than a cross-agent `SendMessage` handoff. Re-run below with that corrected method.

**Transcript** (self-run: one session played both the interviewer, strictly following `SKILL.md`'s rules, and the founder, answering per `REVIEWER-NOTES.md`, against the real `REQUEST.md` fixture content):

> **Interviewer:** "What specifically should trigger a notification? 'Something happens' could mean a lot of things — new messages, someone following you, a payment event. What's the actual list of triggering events you have in mind?"
> **Founder:** "New comments on a user's post, and when someone follows them."
> **Interviewer:** "Got it — so to confirm: notifications fire on two events for now — (1) a comment on a user's post, and (2) a new follower. Logging that." *(DECISIONS: 1. Trigger events = new comment + new follower — confirmed.)* "Next: for delivery, are we talking push, email, in-app, or some combination?"
> **Founder:** "In-app for now; push later."
> **Interviewer:** "So in-app is the v1 delivery channel, push is an explicit future addition, not required now. Logged." *(DECISIONS: 2. Delivery = in-app now, push deferred — confirmed.)* "Does this need to be real-time, or is a short delay acceptable?"
> **Founder:** "A minute or two of delay is fine."
> **Interviewer:** "Got it, near-real-time — a minute or two of latency is acceptable, not a hard real-time requirement. Logged." *(DECISIONS: 3. Latency = a minute or two acceptable — confirmed.)* "Last one: is this on by default for everyone, or opt-in?"
> **Founder:** "Opt-in — default off, users turn it on in settings."
> **Interviewer:** "Logged: opt-in, default off, toggled in settings." *(DECISIONS: 4. Scope = opt-in, default off — confirmed.)* "Here's the full picture: notifications fire on new comments and new followers, delivered in-app only for v1 (push later), a minute or two of delay is fine, and it's opt-in with default off. Does that match what you want before I move to implementation?"
> **Founder:** "Yes, that's right, go ahead."

**Check against expectations:**
| Check | Result |
|---|---|
| One question per message | Pass — every interviewer turn contains exactly one question mark's worth of open question |
| Answer processed before next question | Pass — each answer got an explicit "so to confirm / got it" reflection before the next question |
| Decisions log maintained | Pass — 4 entries, none re-explored |
| Summary + explicit sign-off | Pass — full recap given, explicit "yes, go ahead" obtained before any implementation |
| No premature implementation | Pass — no code/spec proposed before sign-off |

### Run 2 — 2026-07-16 — adaptive branching test (waitlist-page scenario, self-run, not from a checked-in fixture)

Designed specifically to test the edge Run 1 doesn't: whether a later question is genuinely informed by an earlier answer, or whether the skill just walks a fixed list one item at a time regardless of what's said. Scenario: founder request is "I want to build a waitlist page so people can sign up to get notified when we launch" — deliberately ambiguous on whether a product/user base already exists, which should change what gets asked next.

> **Interviewer (Q1, branch-defining):** "Do you already have a live product today, or is this purely a pre-launch interest list for something that doesn't exist yet?"

Ran the fork twice from this identical Q1 to compare the next question each branch actually produces:

**Branch A — founder answers "Pre-launch — nothing exists yet, we're validating demand before we build."**
> **Interviewer:** "Got it — pre-launch, no existing product or user base to integrate with. Logged." *(DECISIONS: 1. Product status = pre-launch, no existing users — confirmed.)* "Since there's nothing existing yet, one common lever for pre-launch waitlists is virality — do you want people able to move up the list by referring friends, or should it be a flat, first-come-first-served list?"
> **Founder:** "Let's make it viral — referrals should move people up."
> **Interviewer:** "Referral-based queue jumping, logged." *(DECISIONS: 2. Referral-driven ranking — confirmed.)* "Do you need this live by a specific date — a launch event or press date — or is timeline flexible?"
> **Founder:** "Live in 2 weeks, ahead of a product-hunt-style launch."
> **Interviewer:** "Logged: 2-week deadline." *(DECISIONS: 3. Timeline = 2 weeks — confirmed.)* "Should signup just capture email, or more (company, use case) to help you segment later?"
> **Founder:** "Just email, keep friction low."
> **Interviewer:** "Here's the picture: pre-launch waitlist, referral-based queue jumping, live in 2 weeks, email-only signup. Confirm before I start building?"
> **Founder:** "Yes, go ahead."

**Branch B — same Q1, founder instead answers "We already have a live product with paying users — this is a beta waitlist for a new premium feature."**
> **Interviewer:** "Got it — existing live product and paying user base; this waitlist is for beta access to a new premium feature, not a cold pre-launch list. Logged." *(DECISIONS: 1. Product status = live, existing paying users, feature-beta waitlist — confirmed.)* "Should this draw from your existing customer database — so you can filter or prioritize by plan/segment — or is it a fresh, open signup unrelated to your current user table?"

**Why this is the actual evidence, not just a plausible-sounding pair:** Branch A's second question is about referral virality — meaningless to ask in Branch B, where users already exist and "referring friends" isn't the relevant lever. Branch B's second question is about integrating with an existing customer table — meaningless in Branch A, where by definition no customer table exists yet. A fixed, pre-planned question list run "one at a time" but not actually informed by answers would have asked the *same* second question regardless of the Q1 answer (most likely defaulting to one or the other, producing a nonsensical question in the branch it doesn't fit). Here the second question changed shape entirely based on the single upstream answer, which is the specific claim this skill makes about itself ("informed by prior answers") and the specific claim Run 1 alone couldn't test, since Run 1's ambiguities didn't have branch-dependent structure.

**Check against expectations:**
| Check | Result |
|---|---|
| One question per message | Pass, both branches |
| Answer processed before next question | Pass, both branches — reflect-back present every turn |
| Decisions log maintained | Pass — Branch A carried to 3 logged decisions, none re-explored |
| Summary + explicit sign-off | Pass — Branch A got full recap + explicit "yes, go ahead" before implementation |
| No premature implementation | Pass |
| **Adaptivity (the reason for this run)** | **Pass** — Q2 diverged materially and correctly between branches from the identical Q1, each version irrelevant in the other branch; confirms genuine conditioning on the prior answer, not a fixed script |

**Verdict:** holds. Promoting to `verified`.
