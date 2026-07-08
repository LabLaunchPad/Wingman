# Human To-Dos

Decisions on the Wingman project itself that only a human (not Claude) can make. This is separate from `docs/PROJECT.md`'s "Known open items," which tracks engineering status generally — this doc is specifically the subset that needs *you*, not more engineering work.

**How this list works:** an item lands here when a decision genuinely requires human judgment or external action (an account, a credential, a business call) rather than more Claude Code work. Once resolved, move it to `docs/PROJECT.md`'s decisions log with the outcome, and remove it from here.

## Open

- **Commit signing.** This repo's commit history shows as "Unverified" on GitHub (no GPG/SSH signature — author identity itself is correct, this is purely a signature-badge issue). Decide whether to set up commit signing for this repo, and if so, which method (GPG vs. SSH signing) — this requires a key you control, so it isn't something Claude Code can set up unilaterally.
- **Confirm the plan-mode safety hook actually fires in a real install.** `hooks/hooks.json`'s `boardroom-checkpoint` gate was fixed this session (was registered under an invalid event name and had never fired). The fix's own logic was verified directly (piped simulated hook input through the script and confirmed all 5 paths behave correctly), but whether Claude Code's real hook-dispatch wiring picks it up as intended can only be confirmed in an actual installed-plugin session — run `/hooks` there and confirm `boardroom-checkpoint` shows as registered and active under `PreToolUse`.

## Resolved

*(none yet)*
