# Recognized Generic Behaviors — Not Duplicated

Practices observed during a real dogfood run that were classified `out-of-scope` because they're
generic agent competence the underlying model/harness already provides, not something specific to
Wingman's own pipeline. Check this list before classifying a new `observed_gaps` entry — if it
matches something already here, it's `out-of-scope` again, not a new finding.

Format: one line per entry, dated, with a one-sentence reason.

- **2026-07-15 — named custom subagent_type dispatch (dept-*/mgr-*/boardroom-*) unavailable in this sandbox's Agent tool.** Already documented independently across multiple prior sessions (`docs/PROJECT.md`'s decisions log, several eval case run logs) as a testing-environment limitation, not a plugin defect — the plugin's own instructions correctly specify dispatching by named agent type; the sandbox this repo happens to be dogfooded in just falls back to a `general-purpose` agent loaded with the real persona file. Re-surfaced during the 2026-07-15 complex-path dogfood run; classified `out-of-scope` again, consistent with the existing record.
