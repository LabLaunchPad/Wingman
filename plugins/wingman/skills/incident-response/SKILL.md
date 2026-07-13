---
name: incident-response
description: Use when production is broken, degraded, or actively under fire — a customer-impacting outage, a deploy that went wrong, data corruption, or a security incident. Provides a calm, ordered runbook so the founder responds instead of panicking.
---

# Incident Response

A calm, ordered runbook for when something is on fire. Founders rarely have an
ops background, so the value here is sequencing under stress: stop the bleed,
contain, diagnose, communicate, then fix — in that order, not all at once.

## When to use
- A production outage, error spike, or "everything is down" message.
- A bad deploy, rollback, or data-corruption event.
- A suspected or confirmed security incident (breach, leaked key, abuse).

## Method (the ordered runbook)
1. **Stabilize first.** Stop the bleed: roll back the deploy, flip the kill
   switch, scale up, or take the affected surface offline. A contained outage
   beats a widening one. Do not debug before you stabilize.
2. **Contain a security event.** If a key leaked, rotate it *now* via the secret
   manager (pair with the `security-checklist` skill and `/wingman:secure`'s
   threat register). Assume exposed until proven otherwise.
3. **Triage.** One sentence: what's broken, who's affected, since when. Scope it
   before fixing.
4. **Diagnose** with the smallest safe step — check the last change, the logs,
   the diff. Resist the urge to rewrite; revert is faster than fix-under-fire.
5. **Communicate.** A short status to users/investors/internal on a fixed
   channel. Silence amplifies panic more than bad news.
6. **Fix + prevent.** After stable, write the one-line postmortem: cause, fix,
   and the guard that stops a repeat (a test, a check, a hook).
7. Lead with "current state" then "next action" — never a wall of logs.

## Output shape
- Status line: Stabilized / Diagnosing / Fixed.
- Bulleted next actions, each owned and ordered.
- A suggested prevention guard to add afterward.

## Rationalizations
- "I'll just fix it live." — Fixing under fire without stabilizing widens blast radius.
- "It's probably fine, monitor." — Unmonitored incidents get worse; contain first.
- "No time to communicate." — A 2-line status costs minutes and saves trust.
- "Root-cause it before rolling back." — Revert is reversible; a widening outage isn't.

## Red Flags
- Debugging before stabilizing.
- Editing the same broken code that's on fire instead of rolling back.
- Hiding the incident from stakeholders.
- No postmortem → the same incident will recur.

## Verification
After acting, re-read your status against the runbook: stabilize happened
before diagnose, the security step rotated (not just noted) any exposed secret,
communication went out, and a concrete prevention guard is named. If "stabilize"
was skipped, the response isn't done.
