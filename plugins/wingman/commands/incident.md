---
description: Calm, ordered incident response when production is broken or a security event is underway — stabilize, contain, triage, diagnose, communicate, then fix and prevent. Use when something is on fire and the founder needs a runbook, not panic.
---

# /wingman:incident

Run an ordered incident response. This is the founder-facing entry point to the
`incident-response` skill — it sequences the response so stress doesn't turn
into chaos.

## When to use
- "Production is down / throwing errors / timing out."
- A bad deploy or rollback.
- Suspected breach, leaked key, or abuse.

## Steps
1. Load the `incident-response` skill and follow its ordered runbook.
2. **Stabilize first** — roll back, kill-switch, or take the surface offline. Do not debug before this.
3. **Contain** any security exposure — rotate the leaked key via the secret manager now (pair with `/wingman:secure`'s threat register and the `security-checklist` skill).
4. **Triage** in one sentence: what's broken, who's affected, since when.
5. **Diagnose** with the smallest safe step (last change → logs → diff). Prefer revert over fix-under-fire.
6. **Communicate** a short status on a fixed channel.
7. **Fix + prevent** — after stable, write the one-line postmortem and name the guard that stops a repeat (test/check/hook).
8. End with a plain-language status (Stabilized / Diagnosing / Fixed) and the next owned action. If the incident has security implications, suggest `/wingman:secure` next.

## Guardrails
- Sequence matters: stabilize → contain → triage → diagnose → communicate → fix.
- Never edit the on-fire code instead of rolling back.
- Lead with current state, then next action.
