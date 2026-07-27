// Wingman Boardroom Verdict tool -- a genuinely new OpenCode-native capability, not a straight hook
// port. Investigated per this pass's exploratory gap 3: does `tool.definition` or a custom
// `tool`-registration hook let a plugin expose Boardroom checkpoint data directly to the model,
// without a Bash roundtrip (`cat .wingman/checkpoints.jsonl | tail -1 | jq ...`)?
//
// Verification status (2026-07-25, real live investigation via `opencode run
// -m opencode/deepseek-v4-flash-free`, zero cost, zero API key): CONFIRMED WORKING, and a genuinely
// valuable addition (not forced in) -- see the adapter README's dated section for the exact
// transcript.
//
// `tool.definition` (the hook investigated first) turned out to be the wrong primitive -- its own
// type signature (`@opencode-ai/plugin`'s `Hooks["tool.definition"]`) only lets a plugin MODIFY an
// EXISTING tool's description/parameters (`input: { toolID }, output: { description, parameters }`),
// not register a brand-new one. The real mechanism is a plugin's returned hooks object having a
// `tool` key: `{ tool: { <name>: ToolDefinition } }`, where `ToolDefinition` comes from the `tool()`
// helper `@opencode-ai/plugin` itself exports (a thin identity wrapper: `description`, a zod `args`
// shape, and an `execute(args, context)` returning a string or `{ title, output, metadata }`).
// Confirmed this is a real, loadable dependency: OpenCode auto-manages a `.opencode/package.json` +
// `node_modules` for its own plugin surface (confirmed live -- `@opencode-ai/plugin` and `zod`
// appeared in a fresh `.opencode/node_modules` the first time `opencode run` touched a scratch
// project that had never had `npm install` run in it) -- no manual install step a founder needs to
// remember.
//
// Live-tested: a fixture `.wingman/checkpoints.jsonl` with a real Build-stage entry (`bottom_line:
// "DO NOT SHIP"`, one NO_GO seat) was placed in a scratch project alongside this plugin file. Asking
// the model "what's the latest Boardroom verdict for this project? Use the wingman_boardroom_verdict
// tool" produced a real `tool` part in the session's message history (confirmed via `GET /session/
// {id}/message`, `type: "tool"`, `tool: "wingman_boardroom_verdict"`) whose result was the exact
// JSON this file's `execute()` returns, and the model's own final text correctly summarized it in
// plain language ("DO NOT SHIP... the CISO seat recorded NO_GO") -- a real, direct tool call, not a
// Bash-shelled-out `cat`/`jq` pipeline the model would otherwise have to construct and parse itself.
//
// This intentionally reads the SAME `.wingman/checkpoints.jsonl` file dod-gate.js's own
// findLatestBuildCheckpoint() reads, but is NOT restricted to the build stage -- a founder (or the
// model on their behalf) may reasonably want "what was the LATEST checkpoint of any stage," not only
// the build gate dod-gate.js cares about for its own git-push decision. Genuinely new code, not a
// duplicate of dod-gate.js's narrower, build-specific lookup.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// `@opencode-ai/plugin` (for the `tool()` helper) and `zod` (for the args schema) are deliberately
// NOT imported at module top-level. OpenCode auto-manages both as real dependencies in a target
// project's own `.opencode/node_modules` (confirmed live -- see this file's header comment), but
// they don't exist in THIS repo's own node_modules (Wingman's dev repo has none, by design -- see
// AGENTS.md's "no build step" note). Importing them only inside the plugin factory below means the
// pure functions (readCheckpoints/findLatestCheckpoint/formatVerdict) stay importable and testable
// with plain `node --test` in this repo, with no dependency on OpenCode's own package management.

// Byte-for-byte the same "last valid JSON line wins" parsing dod-gate.js's findLatestBuildCheckpoint
// uses, but returning ALL checkpoints (optionally filtered by stage) instead of only the newest
// build-stage one -- exported separately so this can be unit-tested without a live OpenCode process.
export function readCheckpoints(cwd, stage) {
  const file = join(cwd, '.wingman', 'checkpoints.jsonl');
  if (!existsSync(file)) return [];
  let lines;
  try {
    lines = readFileSync(file, 'utf-8').split('\n').filter(Boolean);
  } catch {
    return [];
  }
  const entries = [];
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (!stage || entry.stage === stage || entry.bundle === stage) entries.push(entry);
    } catch {
      // skip malformed lines, same fail-open behavior as dod-gate.js
    }
  }
  return entries;
}

export function findLatestCheckpoint(cwd, stage) {
  const entries = readCheckpoints(cwd, stage);
  return entries.length > 0 ? entries[entries.length - 1] : null;
}

// Formats a checkpoint entry into the plain-language shape a founder (or the model summarizing for
// one) actually wants -- not a raw JSON dump. Mirrors the `plain-language-checkpoint` skill's
// writing bar (lead with the consequence, not the mechanism) as closely as a mechanical formatter
// reasonably can.
export function formatVerdict(checkpoint) {
  if (!checkpoint) {
    return { found: false, summary: 'No Boardroom checkpoint has been recorded for this project yet.' };
  }
  const bottomLine = String(checkpoint.bottom_line || 'unknown').toUpperCase();
  const seats = Array.isArray(checkpoint.seats) ? checkpoint.seats : [];
  const noGoSeats = seats.filter((s) => String(s.verdict || '').toUpperCase() === 'NO_GO');
  const concernSeats = seats.filter((s) => String(s.verdict || '').toUpperCase() === 'GO_WITH_CONCERNS');

  const lines = [`Bottom line: ${bottomLine}${checkpoint.stage ? ` (${checkpoint.stage} stage)` : ''}.`];
  if (noGoSeats.length > 0) {
    lines.push(`Blocking: ${noGoSeats.map((s) => s.seat).join(', ')} recorded NO_GO.`);
  }
  if (concernSeats.length > 0) {
    lines.push(`Concerns raised by: ${concernSeats.map((s) => s.seat).join(', ')}.`);
  }
  if (seats.length === 0) {
    lines.push('No individual seat verdicts were recorded on this checkpoint.');
  }

  return { found: true, bottomLine, seats, summary: lines.join(' ') };
}

export const BoardroomVerdictToolPlugin = async ({ directory }) => {
  const cwd = directory || process.cwd();
  const { tool } = await import('@opencode-ai/plugin');
  const { z } = await import('zod');

  return {
    tool: {
      wingman_boardroom_verdict: tool({
        description:
          'Returns the latest Wingman Boardroom checkpoint verdict for this project, read directly ' +
          'from .wingman/checkpoints.jsonl (no need to shell out to cat/jq). Optionally filter by ' +
          'pipeline stage (e.g. "build", "architecture"). Use this whenever a founder asks whether ' +
          'the project is cleared to ship, or what the Boardroom said at a given stage.',
        args: {
          stage: z
            .string()
            .optional()
            .describe('Optional pipeline stage to filter by, e.g. "build". Omit for the latest checkpoint of any stage.'),
        },
        async execute(args) {
          const checkpoint = findLatestCheckpoint(cwd, args?.stage);
          const formatted = formatVerdict(checkpoint);
          return {
            title: formatted.found ? `Boardroom verdict: ${formatted.bottomLine}` : 'No Boardroom verdict found',
            output: JSON.stringify(formatted, null, 2),
          };
        },
      }),
    },
  };
};

export default BoardroomVerdictToolPlugin;
