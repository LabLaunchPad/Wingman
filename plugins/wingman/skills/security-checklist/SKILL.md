---
name: security-checklist
description: Use when running /wingman:build's Definition-of-Done gate or any security pass — work the STRIDE + OWASP + prompt-injection defense checklist and record every risk in the gsd-plugin threat register before allowing advancement. The security gate, not a recitation.
---

<!--
Security checklist shape adapted from `affaan-m/ECC` (MIT) and the OWASP/STRIDE
canon; the enforced disposition model (CLOSED/OPEN, blocks while threats_open >
0) is gsd-plugin's phase-gate pattern. Full checklist at
`references/security-checklist.md`; threat-register mechanics at
`references/threat-register.md`. Attribution in /ATTRIBUTIONS.md.
-->

# Security Checklist

## Overview

A security pass is not a generic checklist recitation — it is a concrete risk hunt whose findings land in the gsd-plugin **threat register** with explicit `CLOSED`/`OPEN` dispositions. Advancement is blocked while any threat is `OPEN`.

## When To Use

During `/wingman:build`'s Definition-of-Done gate and any time code that touches a trust boundary, data, secrets, or an LLM is changed.

## Core Workflow

1. **Hunt concretely.** For the actual change, walk STRIDE (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege) and the OWASP Top-10 classes relevant to it. Name specific risks, not categories.
2. **Prompt-injection defense.** If the change touches an LLM boundary, verify against injection, role manipulation, and secret exfiltration (see `boardroom-ciso`'s baseline).
3. **Register every risk.** Each concrete risk becomes a row in the threat register with a `CLOSED` (fixed, with PR/commit + regression test, or founder-accepted) or `OPEN` disposition. "I looked at it" is not a disposition.
4. **Block on OPEN.** While `threats_open > 0`, the stage does not advance. Fix, or escalate to the founder for explicit acceptance (recorded in `docs/wingman/founder-todos.md`).
5. **Verify.** Confirm the fix with a regression test before marking `CLOSED`.

## Rationalizations

| Excuse | Reality |
|---|---|
| "It's a low-risk thing, no need to register it" | Low-risk items slip through exactly because they're unregistered. One line closes it. |
| "I'll fix it after ship" | After ship there is no gate. `OPEN` means no ship. |
| "The framework handles security for me" | Frameworks help; they don't know your trust boundaries. Verify the specific path. |
| "Prompt injection doesn't apply here" | If any untrusted text reaches the model, it applies. Prove the boundary is closed. |

## Red Flags — Stop and Reconsider

- A security pass that produced zero risks on a change touching a trust boundary (almost always means it wasn't looked at).
- A threat registered but never given a `CLOSED`/`OPEN` disposition.
- "Fixed" claimed without a regression test.
- An `OPEN` risk about to be waved through without founder acceptance.

## Verification

The register itself is the verification: every row `CLOSED` with evidence (PR/commit + test) or founder-accepted, and `threats_open == 0`. See `verification-before-completion` and `references/threat-register.md`.
