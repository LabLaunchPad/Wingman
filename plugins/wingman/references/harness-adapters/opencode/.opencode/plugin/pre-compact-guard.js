// Wingman Pre-Compact Guard, ported to an OpenCode plugin -- the same warn-only
// PreCompact-event hook the shipped Claude Code plugin runs before a context
// compaction (plugins/wingman/hooks/pre-compact-guard.mjs).
//
// Verification status (2026-07-25, real live investigation, not assumed):
//
// 1. `countRelevantChanges()` below is a byte-for-byte port of the canonical hook's
//    exported function of the same name -- same porcelain-line filter, same
//    `.wingman/` exclusion rationale (its own files churn on every routine
//    checkpoint and would make the warning fire on nearly every compaction
//    otherwise). Covered by tests/opencode-gate/opencode-session-lifecycle.test.mjs.
//
// 2. The WIRING -- OpenCode's `experimental.session.compacting` plugin hook --
//    is CONFIRMED WORKING, via a real live test with a genuinely free OpenCode
//    model (`opencode/deepseek-v4-flash-free`, zero cost, zero API key):
//      a. `opencode/deepseek-v4-flash-free`-driven `opencode run`, followed by a
//         real, live-triggered compaction: `POST /session/{id}/summarize` (the
//         server's real underlying route for what the TUI's `/compact` calls --
//         confirmed by finding "session.compact"/"session.compacted" as real
//         strings in the installed binary and then confirming `/summarize` is
//         the actual live HTTP route, not `/compact` itself, which 404s to the
//         SPA catch-all instead).
//      b. That real compaction call caused this exact plugin hook name
//         (`experimental.session.compacting`) to fire, once, with
//         `input = { sessionID }` and `output = { context: [] }` (an empty,
//         mutable array the plugin can push strings into, plus an optional
//         `prompt` key seen on another run) -- both real, observed shapes, not
//         guessed from docs.
//      c. Pushing a plain warning string onto `output.context` from inside the
//         hook does not throw and does not break the compaction call (the
//         server still returned `true` for the `/summarize` request) --
//         confirmed by a live A/B test (mutate vs. no-mutate), so this is a
//         genuine, safe way to surface a warning into the model's own
//         compaction context, not merely a registered-but-inert hook.
//   This is the strongest-confidence port in this adapter's session-lifecycle
//   work, unlike `wingman-gate.js`'s `plan_exit` (confirmed NOT to fire) and
//   `stop-loop.js` (confirmed to enqueue a message but NOT confirmed to
//   actually complete a follow-up model turn before the CLI process exits --
//   see that file's own header and SESSION-LIFECYCLE-FINDINGS.md for the
//   full, honest writeup).
//
// Deliberately WARN-ONLY, matching the canonical hook: nothing here throws or
// blocks the compaction -- it only pushes a plain-text note into the
// compaction context so the note survives into the model's own summary,
// which is arguably a *stronger* place to land a warning than the canonical
// hook's stdout (which Claude Code shows the agent but never folds into the
// compacted memory itself).

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Direct, byte-for-byte port of plugins/wingman/hooks/pre-compact-guard.mjs's
// exported countRelevantChanges -- see that file for the full rationale.
export function countRelevantChanges(porcelainOutput = '') {
  return porcelainOutput
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .filter((l) => !l.slice(3).startsWith('.wingman/')).length;
}

export const PreCompactGuardPlugin = async ({ directory }) => {
  const cwd = directory || process.cwd();

  return {
    'experimental.session.compacting': async (_input, output) => {
      const wingmanDir = join(cwd, '.wingman');
      if (!existsSync(wingmanDir)) return; // not a Wingman-managed project

      let gitStatus = '';
      try {
        gitStatus = execSync('git status --porcelain', {
          cwd,
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore'],
        });
      } catch {
        return; // not a git repo, or git unavailable -- nothing to check
      }

      const uncommittedCount = countRelevantChanges(gitStatus);
      if (uncommittedCount === 0) return;

      const note =
        `Wingman Pre-Compact Guard: ${uncommittedCount} uncommitted change(s) in the working ` +
        `tree. Compaction is about to discard the reasoning behind them from context -- the ` +
        `files themselves are safe (git already has them), but consider committing or noting ` +
        `progress now if a future session will need the "why," not just the diff.`;

      // Confirmed safe by live test (see header): pushing onto output.context
      // does not throw and does not break the compaction call.
      if (Array.isArray(output?.context)) {
        output.context.push(note);
      }
    },
  };
};

export default PreCompactGuardPlugin;
