# Security & Compliance Assessment

## Threat Model

Because Wingman is a markdown-only Claude Code plugin (no executable runtime, no database, no network service), the threat surface is limited to:

1. **Credential leakage** — API keys, tokens, passwords in session input/output
2. **Prompt injection** — malicious instructions embedded in user input or tool output
3. **Destructive commands** — accidental `rm -rf /`, `DROP TABLE`, etc.
4. **Data exfiltration** — sensitive data read by an agent and returned to attacker
5. **Session hijacking** — via configuration injection

## Defenses

### Secret Detection (Two-Layer)

| Layer | Script | Triggers | Patterns | Action |
|---|---|---|---|---|
| PreToolUse | secret-guard.mjs | Any tool output containing key patterns | 6 DESTRUCTIVE patterns (AWS keys, tokens, PEM, etc.) | Blocks tool use, warns user |
| UserPromptSubmit | secret-scanner.mjs | User input | 6 SECRET patterns (AWS, PAT, sk-*, PEM, ANTHROPIC_API_KEY, generic_key) | Logs warning, does not block |

**6 secret patterns covered across both scripts**:
- `AKIA[0-9A-Z]{16}` (AWS access key)
- `gh[pousr]_[A-Za-z0-9_]{36,}` (GitHub tokens)
- `sk-[a-zA-Z0-9]{32,}` (OpenAI keys)
- `-----BEGIN .+? PRIVATE KEY-----` (PEM keys)
- `sk-ant-[a-zA-Z0-9]{40,}` (Anthropic API keys)
- `(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9\/+_]{20,}` (generic high-entropy)

### Prompt Injection Defense

| Script | Trigger | Detection | Action |
|---|---|---|---|
| prompt-guard.mjs | PreToolUse + UserPromptSubmit | Ignores own output (self-reference filter), scans for injection patterns | Warns user, suggests rollback |
| secret-guard.mjs | PreToolUse | Blocks destructive prompt patterns | Blocks tool use |

The prompt guard includes a **self-reference filter** — it ignores output from its own earlier invocations to prevent cascading blocks.

### Destructive Command Prevention

| Script | Detection | Action |
|---|---|---|
| secret-guard.mjs | `rm -rf`, `DROP TABLE`, `shutdown`, etc. | Blocks tool execution |

### Structural Gates

| Gate | Trigger | Check | Action |
|---|---|---|---|
| boardroom-checkpoint.mjs | ExitPlanMode | Plan file contains Boardroom verdict section | Blocks exit if missing/DO NOT SHIP |
| dod-structural-gate.mjs | git push | Tests exist, threat register clean, requirements met | Blocks push if missing |
| stop-loop.mjs | Stop event (loop iteration) | Iteration count > max (default 50) | Terminates loop |

## Static Analysis

| Check | Tool | Scope |
|---|---|---|
| validate-structure.mjs | Custom Node.js | Frontmatter completeness, file existence, ref integrity |
| check-traceability.mjs | Custom Node.js | `wingman:req`/`wingman:log` marker cross-referencing |
| check-repo-consistency.mjs | Custom Node.js | Doc integrity, attribution invariants |
| check-fixtures.mjs | Custom Node.js | Eval fixture shell scripts execute without error |

## Dependency Analysis

| Category | Dependencies | Risk |
|---|---|---|
| Runtime | Node.js stdlib only (fs, path, child_process, url, os, assert) | ✅ None |
| CI/CD | GitHub Actions ubuntu-latest, bash, gh CLI | ✅ Standard |
| Eval harness | claude -p (CLI), bash | ✅ Sandboxed per-fixture |
| Hooks | Claude Code lifecycle events | ✅ Controlled |
| No npm packages, no external APIs, no database | — | ✅ Minimal |

## Compliance Against Standards

### OWASP Top 10 (2021)

| Category | Risk | Wingman Mitigation |
|---|---|---|
| A01 Broken Access Control | Low — no user auth | N/A (single-user in Claude Code) |
| A02 Cryptographic Failures | Low — no secrets stored | Secrets never persisted |
| A03 Injection | Medium — prompt injection | Two-layer detection (prompt-guard + secret-guard) |
| A04 Insecure Design | Low — no runtime | Architecture eliminates entire class |
| A05 Security Misconfiguration | Low — plugin model | Fixed hooks.json, no user-serviceable config |
| A06 Vulnerable Components | Low — stdlib only | No npm dependencies to audit |
| A07 Auth Failures | N/A — no auth system | Single-user session model |
| A08 Data Integrity Failures | Low — flat files | Append-only logs, immutable checkpoint history |
| A09 Logging Failures | Low — session logging | 20-session rolling window |
| A10 SSRF | Low — no outbound requests | WebFetch by Research agent only |

### STRIDE

| Category | Risk | Mitigation |
|---|---|---|
| Spoofing | Low | Claude Code session identity |
| Tampering | Low | Flat file state, no multi-user |
| Repudiation | Low | Append-only checkpoints.jsonl |
| Info Disclosure | Medium | Two-layer secret detection |
| DoS | Low | stop-loop.mjs iteration cap (50) |
| Elevation of Privilege | Low | Plugin sandbox, no elevated commands |

## Security Gaps

1. **No encryption at rest** — `.wingman/*.json` files are plain text on disk. This is acceptable per NFR-1 (no hosted backend) since these files live on the founder's own machine.
2. **No input sanitization for agent output** — secret-scanner only checks user input, not tool output (secret-guard covers tool output for destructive patterns only).
3. **No network egress monitoring** — Claude Code's own telemetry is out of Wingman's control.
4. **Self-reference filter in prompt-guard** is heuristic-based — could potentially miss crafted injections.
5. **No formal penetration testing** — all defenses are design-level; no adversarial testing performed.
