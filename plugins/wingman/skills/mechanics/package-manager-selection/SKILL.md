---
name: package-manager-selection
description: Use during /wingman:build's "Before starting" step, the first time a new Node/JS project needs a package manager at all — never for a project that already has one. Triggers whenever build.md is about to run an install/add/script command and no lock file or packageManager field exists yet.
---

# Package Manager Selection

## Overview

This is a real, previously-idle proposal (see `docs/PROJECT.md`'s decisions log) reviewed by a real
7-seat Boardroom dispatch: pnpm's phantom-dependency prevention and disk/speed wins are genuinely
better defaults for a founder's *new* Node/JS project than npm, but three things had to be true
before this became more than a preference — a corepack-pinned install (not an unpinned global
install, a real supply-chain surface the CISO seat named), an automatic fallback if pnpm isn't
available (the CPO/CTO seats' concern), and reuse of an already-solved detection pattern rather than
a from-scratch design (the Research seat's finding: `vendor/ecc`'s `scripts/lib/package-manager.js`
already solves this exact problem well — see `ATTRIBUTIONS.md`).

**Core principle:** this fires exactly once per project, at the exact moment a new Node/JS project
first needs a package manager and doesn't have one yet — never for a project that already has a
lock file (respecting whatever already exists is a hard rule, not a preference), and never as a
blanket "always use pnpm" mandate.

## When To Use

At `/wingman:build`'s "Before starting" step, only when **all** of the following are true:
- The project is JS/TS (has, or is about to get, a `package.json`).
- No lock file exists yet (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`).
- No `package.json` `packageManager` field exists yet.

If any of those already exist, this skill does not apply — use whatever's already there, full stop
(see Constraints).

## Core Workflow

**1. Detect first, choose second.** Check, in order (adapted from `vendor/ecc`'s detection
priority, cited in `ATTRIBUTIONS.md`):
   - Does a lock file already exist? → use that package manager. Stop here; nothing else in this
     skill applies.
   - Does `package.json` already have a `packageManager` field? → use that. Stop here.
   - Neither exists → this is a genuinely new project. Continue to step 2.

**2. Default to pnpm, corepack-pinned, with an automatic npm fallback:**
   - Run `corepack enable` first (ships with Node 16.9+; if it fails or isn't present, that's the
     fallback signal — go straight to npm, silently, no error shown to the founder over something
     this minor).
   - Set `package.json`'s `packageManager` field to an exact pinned version (e.g.
     `"packageManager": "pnpm@9.12.1"`, not a bare `"pnpm"`) — corepack reads this field and fetches
     a signature-verified, exact-version pnpm on first use, which is what actually closes the
     CISO's unpinned-global-install concern; a bare `"pnpm"` with no version doesn't.
   - Run `pnpm install` (or the project's real first install command). If this fails for any reason
     (corepack unavailable, network issue, pnpm itself erroring), fall back to `npm install`
     immediately and set `packageManager` to a pinned npm version instead — never leave the founder
     with a half-configured project because pnpm didn't work on their machine.

**3. Tell the founder one plain-language sentence about the choice** — e.g. "I've set this project
up with pnpm, which is faster and catches a class of dependency bugs npm doesn't — you don't need
to do anything differently, `npm install` still works if you ever prefer it." Never a paragraph
explaining phantom dependencies or disk-usage benchmarks.

**4. Never touch an existing project's package manager.** If a lock file or `packageManager` field
already exists — even from a previous, different choice — leave it exactly as it is. This skill's
only job is the *first* decision on a genuinely new project.

## Constraints

**MUST:**
- Check for an existing lock file or `packageManager` field before doing anything else.
- Pin an exact version in `packageManager` (via corepack), never a bare package-manager name.
- Fall back to npm automatically and silently if pnpm/corepack fails for any reason.
- Tell the founder one plain-language sentence about the choice, once.

**MUST NOT:**
- Rip out or override an existing lock file or `packageManager` field, ever, for any reason.
- Treat this as a blanket "always use pnpm" mandate applied outside a genuinely first-time decision.
- Show the founder an error or a technical explanation when the pnpm fallback happens — it's a
  silent, correct recovery, not a failure worth surfacing.
- Spawn child processes to probe for installed package managers on every run (a real, documented
  cause of session/hook slowdowns in `vendor/ecc`'s own history — detect from files/config instead).

## Rationalizations

| Excuse | Reality |
|---|---|
| "pnpm is just better, I don't need to check for an existing lockfile" | An existing lock file means a founder (or a prior session) already made this choice — respecting it is a hard rule, not a suggestion, per the original Boardroom-reviewed proposal. |
| "corepack is an extra step, plain `pnpm install` is simpler" | An unpinned global pnpm install is exactly the supply-chain surface the CISO seat flagged — corepack-pinning is the whole point, not an optional nicety. |
| "If pnpm fails, just tell the founder and stop" | A silent, automatic npm fallback was the CPO/CTO seats' explicit condition for shipping this at all — surfacing a technical failure over a package-manager choice fails the "founder never needs to understand git/CI" bar this whole project holds itself to. |
| "I'll design my own detection logic, it's not that hard" | `vendor/ecc` already solved this well (lock-file → `packageManager` field → config → default), and the Research seat's whole finding was that skipping this reuse was the actual gap — don't re-litigate a solved problem. |

## Red Flags — Stop and Reconsider

- About to run any install command before checking whether a lock file already exists.
- About to set `packageManager` to a bare name with no pinned version.
- About to show the founder a pnpm-failed error instead of silently falling back to npm.
- About to apply this to a project that already has a lock file "because pnpm would be better."

## Verification

Before running any install command: confirm via a real file check (not memory) that no lock file
and no `packageManager` field exist yet. After the choice is made: confirm `package.json`'s
`packageManager` field is an exact pinned version, and that the install actually succeeded (real
command output, not assumed) — if it didn't, confirm the npm fallback path was actually taken and
also succeeded before continuing.

## Output

No founder-facing template beyond the one-sentence notification in Core Workflow step 3.

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "pnpm is just better, skip the lockfile check" | See Rationalizations above — an existing choice is respected, not overridden. |
| "corepack is overkill for a small project" | The size of the project doesn't change the supply-chain-pinning reasoning; this is a fixed, cheap step every time, not a judgment call to skip. |
| "I'll explain the fallback to the founder so they understand" | The explicit design goal is a silent, correct recovery — explaining it adds technical noise for zero founder benefit. |

### Red Flags

- Running an install command before checking for an existing lock file.
- A `packageManager` field with no version pinned.
- Surfacing a pnpm-failure error to the founder instead of silently falling back.

### Anti-Pattern Callouts

- **Override-the-existing-choice**: applying pnpm-by-default logic to a project that already has a
  different package manager configured — the single most likely way this skill could cause real
  harm (a founder's working project suddenly has two lock files, or a broken one).
- **Unpinned-install reflex**: treating `packageManager: "pnpm"` (no version) as equivalent to a
  pinned version — it isn't; corepack's signature verification only actually engages with an exact
  version.

## Referenced by

- `skills/output/visual-founder-output`

See `docs/ARCHITECTURE.md` for this skill's place in Wingman's overall architecture.
