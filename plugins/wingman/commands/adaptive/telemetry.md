---
description: Check whether a newly shipped feature has a way to tell if it's actually working in production, and add lightweight observability if not.
argument-hint: "[optional: feature or area to check]"
---

# Wingman: Telemetry

Shipping isn't the finish line — a founder needs to know afterward whether the thing that shipped is actually working, without asking an engineer to go dig through logs. This command is a light touch, not a bespoke analytics platform: use whatever this project already has (error tracking, an analytics package, structured logs) before proposing something new.

$ARGUMENTS

## Check what already exists

Look for existing error tracking (e.g. Sentry-style setup), analytics, or structured logging in the project. Reuse it — do not introduce a second, competing tool.

## For the feature in scope, confirm

1. **Errors are visible** — if this feature fails in production, will anyone find out, or will it fail silently?
2. **Usage is visible** — if this feature is meant to be used, is there any signal (even a simple log line or count) that it's actually being used, so the founder can tell if it landed or if nobody's touching it?
3. **No sensitive data leaks into logs/telemetry** — cross-check with `/wingman:build`'s Definition-of-Done gate concerns; never log secrets, credentials, or raw customer PII.

## If gaps exist

Propose the smallest addition that closes the gap — usually a few lines using the project's existing tooling, not a new dependency. Explain in plain language what the founder will be able to see afterward and where (e.g. "you'll see a count of signups in your analytics dashboard tomorrow").

## If nothing exists yet in the project

Do not silently pick a vendor for the founder. Summarize the tradeoff in plain language (a hosted error-tracking tool vs. simple log files vs. nothing yet) and ask which they'd prefer, sized by effort and cost.
