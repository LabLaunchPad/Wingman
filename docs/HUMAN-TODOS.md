# Human To-Dos

Decisions on the Wingman project itself that only a human (not Claude) can make. This is separate from `docs/PROJECT.md`'s "Known open items," which tracks engineering status generally — this doc is specifically the subset that needs *you*, not more engineering work.

**How this list works:** an item lands here when a decision genuinely requires human judgment or external action (an account, a credential, a business call) rather than more Claude Code work. Once resolved, move it to `docs/PROJECT.md`'s decisions log with the outcome, and remove it from here.

## Open

### Credentials / environment
- **Checked, none needed.** Swept the repo for any `.env`, API key, or secret requirement — Wingman's plugin itself is markdown + one Node hook script, no external service integration, no runtime dependency that needs a credential. The only API-key mentions in the repo are inside eval fixture *content* (a deliberately fake, seeded test snippet in `evals/cases/full-pipeline-e2e.md`) and the security checklist text in `boardroom-security.md` — neither is a real credential this project needs you to provide. Nothing to do here unless that changes (e.g. a future specialist or department lead integrates a real third-party service).

### Publishing / release
- **This branch has never been merged.** `main` on GitHub is still just the original "Initial commit" — every command, skill, agent, doc, and eval built across this entire project (13 commands, 10 skills, all fixes) lives only on `claude/init-6eg3d1`. Decide when/how to merge (a reviewed PR vs. a direct merge), and whether `main` should require review going forward.
- **Marketplace listing content.** `.claude-plugin/marketplace.json` and `plugin.json` are structurally complete, but nothing has been submitted anywhere yet (Anthropic's official plugin marketplace, or wherever you intend to list this). That's an account/submission action only you can take, and it may have its own content requirements beyond what's in this repo.
- **Repo visibility and settings.** Confirm `LabLaunchPad/Wingman`'s visibility (public/private) matches intent before any wider release, and decide on branch protection for `main` if multiple people will push to this repo later.

### Demo content — genuinely can't be produced from this sandbox
- **Screenshots or a short demo (GIF/video) of Wingman actually running.** The repo currently has zero visual content anywhere — `README.md` is text-only. Every "real" run in this project's evals happened against throwaway fixtures with sandbox workarounds (simulated `AskUserQuestion` answers, general-purpose agents standing in for named personas) — none of it is footage of the real, installed plugin running in a real Claude Code session against a real project, which is what a screenshot/demo needs to show honestly. This requires you (or someone) to actually install Wingman and run `/wingman:plan` (or the full pipeline) on a real or realistic project, then capture the output.
- **`README.md` is stale relative to actual status.** It still reads "under active design and build-out" and lists only 3 doc links — it doesn't reflect the pipeline being built, tested, and behaviorally verified (13 commands, 10 skills, 10 eval cases). I can refresh the text itself on request, but the demo content above still needs a real session.

### Legal / compliance sanity check
- **Independent review of the attribution work before any public release.** `ATTRIBUTIONS.md` documents provenance for 16 vendored repos, including one (`andrej-karpathy-skills`) with no LICENSE file that's been treated as idea-only/describe-don't-quote rather than adapted verbatim. I did this work myself over the course of the project — a second, independent (human or legal) pass before public release is worth doing rather than trusting my own self-check on anything license-adjacent.

### Carried over from before
- **Commit signing.** This repo's commit history shows as "Unverified" on GitHub (no GPG/SSH signature — author identity itself is correct, this is purely a signature-badge issue). Decide whether to set up commit signing for this repo, and if so, which method (GPG vs. SSH signing) — this requires a key you control, so it isn't something Claude Code can set up unilaterally.
- **Confirm the plan-mode safety hook actually fires in a real install.** `hooks/hooks.json`'s `boardroom-checkpoint` gate was fixed this session (was registered under an invalid event name and had never fired). The fix's own logic was verified directly (piped simulated hook input through the script and confirmed all 5 paths behave correctly), but whether Claude Code's real hook-dispatch wiring picks it up as intended can only be confirmed in an actual installed-plugin session — run `/hooks` there and confirm `boardroom-checkpoint` shows as registered and active under `PreToolUse`.
- **Real dogfooding, not just sandboxed evals.** Every behavioral eval in `evals/cases/` ran against throwaway fixtures in a sandbox with no real plugin install — real named-agent dispatch (`dept-*`, `boardroom-*` as actual Claude Code subagent types), real `AskUserQuestion` prompts, and real founder judgment have never been exercised. This is the single biggest gap between "verified in this sandbox" and "proven in production" — worth doing once the branch above is merged and installed for real.

## Resolved

*(none yet)*
