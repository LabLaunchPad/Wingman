# Human To-Dos

Decisions on the Wingman project itself that only a human (not Claude) can make. This is separate from `docs/PROJECT.md`'s "Known open items," which tracks engineering status generally — this doc is specifically the subset that needs *you*, not more engineering work.

**How this list works:** an item lands here when a decision genuinely requires human judgment or external action (an account, a credential, a business call) rather than more Claude Code work. Once resolved, move it to `docs/PROJECT.md`'s decisions log with the outcome, and remove it from here.

## Open

### Credentials / environment
- **Checked, none needed.** Swept the repo for any `.env`, API key, or secret requirement — Wingman's plugin itself is markdown + one Node hook script, no external service integration, no runtime dependency that needs a credential. The only API-key mentions in the repo are inside eval fixture *content* (a deliberately fake, seeded test snippet in `evals/cases/full-pipeline-e2e.md`) and the security checklist text in `boardroom-security.md` — neither is a real credential this project needs you to provide. Nothing to do here unless that changes (e.g. a future specialist or department lead integrates a real third-party service).

### Publishing / release
- ~~This branch has never been merged~~ — **merged.** PR #1 (https://github.com/LabLaunchPad/Wingman/pull/1) and a small follow-up, PR #2 (https://github.com/LabLaunchPad/Wingman/pull/2, folded into #1's diff before merging), are both merged into `main` as of 2026-07-08, on your explicit go-ahead. Before merging: re-ran `validate-structure.mjs` fresh on the merged result (PASS), directly re-confirmed the hook-validation fix genuinely catches the original bug (simulated it again, got the expected failure, restored the real file), and checked that every behavioral file changed since its last eval verification had already been re-exercised by a later real pipeline run — nothing was merged on unverified evidence. `main` now has everything this project has built. Still open: decide whether `main` should require review going forward.
- **Marketplace listing content.** `.claude-plugin/marketplace.json` and `plugin.json` are structurally complete, but nothing has been submitted anywhere yet (Anthropic's official plugin marketplace, or wherever you intend to list this). That's an account/submission action only you can take, and it may have its own content requirements beyond what's in this repo.
- **Repo visibility and settings.** Confirm `LabLaunchPad/Wingman`'s visibility (public/private) matches intent before any wider release, and decide on branch protection for `main` if multiple people will push to this repo later.

### Demo content — genuinely can't be produced from this sandbox
- **Screenshots or a short demo (GIF/video) of Wingman actually running.** The repo currently has zero visual content anywhere — `README.md` is text-only. Every "real" run in this project's evals happened against throwaway fixtures with sandbox workarounds (simulated `AskUserQuestion` answers, general-purpose agents standing in for named personas) — none of it is footage of the real, installed plugin running in a real Claude Code session against a real project, which is what a screenshot/demo needs to show honestly. See `docs/DEMO-CHECKLIST.md` for exactly what's worth capturing and in what order, so this doesn't require guessing.
- ~~`README.md` is stale relative to actual status~~ — refreshed to reflect actual build/eval status and link to `PROJECT.md`/`HUMAN-TODOS.md`/`evals/README.md`. The demo content above still needs a real session — text alone can't substitute for it.

### Legal / compliance sanity check
- **Independent review of the attribution work before any public release.** `ATTRIBUTIONS.md` documents provenance for 16 vendored repos. A self-check pass just found and fixed a real error: `andrej-karpathy-skills` was documented across `ATTRIBUTIONS.md`, `docs/ARCHITECTURE.md`, and `engineering-minimalism/SKILL.md`'s own header comment as having "no LICENSE file," when it actually declares MIT in three places (`plugin.json`, `README.md`, and the `SKILL.md` frontmatter) — just not as a standalone `LICENSE` file. Corrected everywhere it appeared. This didn't create any real exposure (the content was always restated in Wingman's own words, never quoted, regardless of the license status), but it's exactly the kind of error worth a genuinely independent human/legal pass catching before public release, since I did this attribution work myself and just found my own mistake in it.

### Carried over from before
- **Commit signing.** This repo's commit history shows as "Unverified" on GitHub (no GPG/SSH signature — author identity itself is correct, this is purely a signature-badge issue). Decide whether to set up commit signing for this repo, and if so, which method (GPG vs. SSH signing) — this requires a key you control, so it isn't something Claude Code can set up unilaterally.
- **Confirm the plan-mode safety hook actually fires in a real install.** `hooks/hooks.json`'s `boardroom-checkpoint` gate was fixed this session (was registered under an invalid event name and had never fired). The fix's own logic was verified directly (piped simulated hook input through the script and confirmed all 5 paths behave correctly), but whether Claude Code's real hook-dispatch wiring picks it up as intended can only be confirmed in an actual installed-plugin session — run `/hooks` there and confirm `boardroom-checkpoint` shows as registered and active under `PreToolUse`.
- **Real dogfooding, not just sandboxed evals.** Every behavioral eval in `evals/cases/` ran against throwaway fixtures in a sandbox with no real plugin install — real named-agent dispatch (`dept-*`, `boardroom-*` as actual Claude Code subagent types), real `AskUserQuestion` prompts, and real founder judgment have never been exercised. This is the single biggest gap between "verified in this sandbox" and "proven in production." `main` now has everything needed to install for real — this is next.

## Resolved

*(none yet)*
