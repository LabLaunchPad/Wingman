---
description: Export this project's Wingman-tracked decisions, checkpoints, and memory into a Google Open Knowledge Format (OKF v0.1) bundle other AI tools (Gemini, ChatGPT connectors, etc.) can read without any Wingman- or Claude-specific reader.
argument-hint: "[optional: output directory, defaults to .wingman/okf-export/]"
---

# Wingman: Knowledge Export

Everything Wingman has tracked about this project's decisions lives under `.wingman/` in Wingman's own formats (JSONL checkpoints, prose memory files) — genuinely useful, but only readable by something that already knows Wingman's shapes. This command exports it into [OKF v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog), a plain directory of markdown files with light YAML frontmatter, so a founder can point Gemini, a ChatGPT connector, or any other AI tool at their own project history without a Wingman-specific integration.

Opt-in only — this never runs automatically as part of the pipeline. Invoke it when a founder wants to hand their project's decision history to a different AI tool, or wants a single, human-browsable "what has this project decided and why" view (a real gap `docs/DATABASE.md` names explicitly: no file today unifies checkpoints, state, and memory into one surface).

$ARGUMENTS

## What this does

Calls the shipped, dependency-free script directly — no bespoke generation, no LLM paraphrasing of the underlying data, because this is a deterministic, mechanical format transform:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/okf-export.mjs" --project-dir <project root> [--out <output dir>]
```

Reads (read-only, never modified):
- `.wingman/checkpoints.jsonl`
- `.wingman/memory/MEMORY.md`, `.wingman/memory/decisions.md`, `.wingman/memory/tried.md`

Writes a fresh bundle to `.wingman/okf-export/` (or the output directory given in `$ARGUMENTS`), overwriting only that directory — an additive export artifact, never touching the source files above.

## Tell the founder, in plain language

- Where the bundle was written and how many concept files it contains (relay the script's own summary line — don't re-derive the counts).
- That it's safe to point another AI tool's file/folder connector at that directory, or hand it to `gemini` or a ChatGPT file upload.
- That re-running this command is always safe (it fully regenerates the bundle) and does not touch `.wingman/checkpoints.jsonl` or `memory/*.md`.
- If any source file was missing or empty (e.g. no `tried.md` yet), say so in one line rather than silently producing a thinner bundle with no explanation.

## When not to use this

If the project has no `.wingman/checkpoints.jsonl` and no populated `memory/*.md` yet, there's nothing meaningful to export — say so plainly rather than writing an empty bundle that looks like output.
