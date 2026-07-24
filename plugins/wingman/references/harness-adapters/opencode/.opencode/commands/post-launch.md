---
description: Opt-in, founder-run review of usage/support signals after /wingman:ship — feeds real findings back into the next /wingman:discovery pass. Not a pipeline stage.
argument-hint: "[optional: what to focus the review on, e.g. a specific feature or complaint]"
---

# Wingman: Post-Launch

An adaptive command, not part of the fixed 14-stage pipeline (see `docs/ARCHITECTURE.md` §4d) — run periodically, at the founder's discretion, some time after `/wingman:ship`, once there's actually real usage or support signal to look at. Running this immediately after shipping, before any real users have touched the product, produces nothing useful — wait until there's something real to review.

$ARGUMENTS

## Gather real signals

Ask the founder (or read whatever they've already gathered) for real post-launch evidence: support tickets or complaints, usage patterns if instrumented, direct user feedback, anything that shipped but clearly isn't working the way `implementation-planning.md`'s Plain-Language Summary said it would. Do not manufacture signal that doesn't exist — if the founder has nothing concrete yet, say so plainly and stop here rather than inventing plausible-sounding "findings."

## Review against what was intended

For each real signal gathered, compare it against the original `DEF-*` requirements and `DISC-*` problem statement it traces back to (if traceable — some post-launch signal legitimately falls outside anything scoped originally, and that's a finding in itself, not a gap to paper over). Note where reality diverged from what was planned, and by how much.

## Write the review

Produce a short, plain-language summary for the founder:

```markdown
## Post-launch review — <YYYY-MM-DD>

**What we looked at:** <the real signals gathered above>
**What's working:** <concrete, evidence-based — not a vibe>
**What isn't:** <concrete, evidence-based, with the closest DEF-*/DISC-* ID it traces back to if any>
**What this means for the next Discovery pass:** <specific, actionable — feeds directly into the next `/wingman:discovery` run, not a vague "keep monitoring">
```

Append this to `docs/wingman/post-launch/<short-slug>.md` in the founder's project (creating the directory if needed, same slug convention as the rest of the pipeline where a slug applies).

## Record the checkpoint

Run `/wingman:boardroom` with scope set to this review — this is an ad-hoc `/wingman:boardroom` invocation, not one of the 14 pipeline-stage checkpoints, so it records with a free-text `"stage": "post-launch"` (and `"bundle"` set to the same value) in `.wingman/checkpoints.jsonl`, per `docs/DATABASE.md`'s schema. No new traceability prefix is minted by this command.

## Feed it forward

If the review surfaces something that should change what gets built next, hand it directly to the founder's next `/wingman:discovery` run as input — this is the loop this command exists to close: real post-launch evidence flowing back into planning, not a one-off report that gets read once and forgotten.

## References

- `docs/ARCHITECTURE.md` §4d — why this is an adaptive command, not a 15th pipeline stage.
- `docs/DATABASE.md` — the `checkpoints.jsonl` schema this command's ad-hoc entry follows.
- `commands/pipeline/discovery.md` — where this review's findings feed back into.
