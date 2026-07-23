# Security Checklist — Cross-Skill Reference

Applied by the Security seat at every Boardroom checkpoint. Skills that touch auth, data, I/O, or external services must reference this checklist. Every item must be verified with evidence, not assumed.

---

## 1. STRIDE Threat Model Summary

Apply STRIDE to every significant feature or change. Classify threats, then verify mitigations.

| Threat | Question | Verification |
|--------|----------|-------------|
| **S**poofing | Can an attacker pretend to be a legitimate user or system? | Auth mechanisms tested with invalid/expired credentials |
| **T**ampering | Can data be modified in transit or at rest without detection? | Integrity checks, signed payloads, checksums verified |
| **R**epudiation | Can a user deny performing an action? | Audit logging present with timestamps and actor identity |
| **I**nformation Disclosure | Can an attacker access data they shouldn't? | Authorization checks on every data access path |
| **D**enial of Service | Can the system be overwhelmed? | Rate limiting, input size limits, timeout handling |
| **E**levation of Privilege | Can a user gain unauthorized capabilities? | Role checks enforced server-side, not just UI |

**Process:** For each feature, list applicable STRIDE categories, identify specific threats, and document mitigations. Add unmitigated threats to the risk register.

---

## 2. OWASP Top 10 Quick Reference

Quick checklist aligned to OWASP Top 10 (2021). Verify against the codebase.

| # | Risk | Key checks |
|---|------|-----------|
| A01 | Broken Access Control | Authorization enforced on every endpoint; no IDOR; role checks server-side |
| A02 | Cryptographic Failures | TLS enforced; no plaintext secrets; strong algorithms only (AES-256, RSA-2048+) |
| A03 | Injection | Parameterized queries; input sanitization; no `eval()` on user input |
| A04 | Insecure Design | Threat modeling done; security requirements in specs |
| A05 | Security Misconfiguration | Default credentials changed; error messages don't leak internals; debug mode off in prod |
| A06 | Vulnerable Components | Dependencies audited (`npm audit`, `bun audit`); no known CVEs at HIGH/CRITICAL |
| A07 | Auth Failures | MFA supported; brute-force protection; session management secure |
| A08 | Data Integrity Failures | CI/CD pipeline secured; deserialization validated; update mechanisms signed |
| A09 | Logging Failures | Security events logged; logs don't contain secrets; log injection prevented |
| A10 | SSRF | User-supplied URLs validated against allowlist; internal network access restricted |

---

## 3. Authentication & Authorization Verification

### Authentication

- [ ] Passwords hashed with bcrypt/argon2 (never MD5/SHA1)
- [ ] Session tokens are random, high-entropy, rotated on privilege change
- [ ] JWTs have expiration, are validated on every request, and aren't stored in localStorage
- [ ] MFA available for sensitive operations
- [ ] Account lockout or rate limiting after failed attempts
- [ ] Password reset flow doesn't leak user existence
- [ ] OAuth/OIDC flows use state parameter and PKCE where applicable

### Authorization

- [ ] Every endpoint/function has explicit authorization check
- [ ] Authorization is server-side (never client-side only)
- [ ] Role checks use deny-by-default (explicit allow, implicit deny)
- [ ] Resource-level authorization (not just endpoint-level)
- [ ] Multi-tenant isolation verified (no cross-tenant data access)
- [ ] Service accounts follow least-privilege principle

---

## 4. Input Validation Requirements

- [ ] All external input validated at system boundary (before processing)
- [ ] Validation is server-side (client-side validation is UX, not security)
- [ ] Whitelist validation preferred over blacklist
- [ ] Type, length, range, and format validated
- [ ] SQL/NoSQL injection prevented via parameterized queries/ORM
- [ ] Command injection prevented (no shell execution with user input)
- [ ] Path traversal prevented (no direct file path construction from user input)
- [ ] File upload validated: type, size, content (not just extension)
- [ ] HTML/XML input sanitized against XSS and XXE
- [ ] JSON schema validation for API request bodies

---

## 5. Secret Management Rules

### Never

- Hardcode secrets in source code
- Commit `.env` files or secrets to version control
- Log secrets (in application logs, error messages, or debug output)
- Transmit secrets over unencrypted channels
- Store secrets in plaintext at rest
- Put secrets in URLs, query parameters, or fragment identifiers
- Share secrets via chat, email, or ticketing systems

### Always

- Use environment variables or secret managers (Vault, AWS Secrets Manager, etc.)
- Rotate secrets on a defined schedule or after suspected compromise
- Use separate secrets per environment (dev, staging, prod)
- Validate that `.gitignore` excludes all secret files
- Audit secret access with logging
- Use short-lived tokens where possible (JWT expiry, rotating API keys)

### Verification Command

```bash
grep -rn --include="*.ts" --include="*.js" --include="*.json" \
  -E "(password|secret|token|apikey|api_key|private_key)\s*[:=]\s*['\"]" \
  --exclude-dir=node_modules --exclude-dir=.git
```

Expected result: zero matches in application code (config/env files excluded by design).

---

## 6. CORS & Security Headers

### CORS

- [ ] `Access-Control-Allow-Origin` is NOT `*` in production
- [ ] Allowed origins are explicitly listed
- [ ] Credentials mode only with specific origins (not `*`)
- [ ] Preflight responses cached appropriately
- [ ] Methods and headers are restrictive (only what's needed)

### Security Headers (if serving HTTP)

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS |
| `Content-Security-Policy` | Restrictive policy | XSS mitigation |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing prevention |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` | Clickjacking prevention |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leakage |
| `Permissions-Policy` | Restrictive | Feature access control |
| `X-XSS-Protection` | `0` (rely on CSP) | Deprecated, disable |

---

## 7. Prompt Injection Defense Baseline

For any system that processes LLM prompts or user-generated text that may be sent to AI models. Based on gstack's L1-L6 defense-in-depth pattern.

### Layer 1 — Input Classification

- Classify every input as trusted (system) or untrusted (user/external)
- Tag untrusted inputs with metadata before processing
- Reject or quarantine inputs that exceed length/complexity thresholds

### Layer 2 — Input Sanitization

- Strip or escape known injection patterns (e.g., `ignore previous instructions`, `system:`, `assistant:`)
- Normalize Unicode to prevent homoglyph attacks
- Remove or escape control characters
- Limit input to expected format (plain text, not arbitrary markup)

### Layer 3 — Instruction Hierarchy

- Separate system instructions from user content with clear delimiters
- Use structured formats (JSON, XML) for data embedding
- Never interpolate raw user input into system prompts
- Use parameterized prompt templates, not string concatenation

### Layer 4 — Output Validation

- Validate LLM outputs against expected schema/format
- Filter outputs that contain system-level directives
- Don't return raw LLM output to privileged contexts without sanitization
- Implement output length limits

### Layer 5 — Behavioral Monitoring

- Log prompt and response pairs for audit
- Detect anomalous patterns (repeated injection attempts, unusual output structure)
- Rate-limit LLM calls per user/session
- Alert on policy violations

### Layer 6 — Human-in-the-Loop

- Flag high-risk operations for human review
- Require explicit confirmation for irreversible actions
- Maintain kill switch for LLM integration
- Never let LLM output directly modify security-critical state

### Verification

- [ ] Test with known injection payloads (OWASP LLM Top 10)
- [ ] Verify system prompt is not leaked in error responses
- [ ] Confirm input/output logging captures injection attempts
- [ ] Validate that injection doesn't escalate privileges or bypass authorization

---

## Application Rules

1. **Security seat** owns this checklist at every Boardroom checkpoint.
2. Any task touching auth, data, encryption, or external services triggers the full checklist.
3. Any HIGH or CRITICAL finding is a **blocking NO_GO** — no override without documented risk acceptance by the founder.
4. MEDIUM findings must be tracked in the risk register with a remediation timeline.
5. This checklist is versioned. Updates require a Boardroom checkpoint with the Security seat.

## Cited by

- `plugins/wingman/skills/security-checklist/SKILL.md`
