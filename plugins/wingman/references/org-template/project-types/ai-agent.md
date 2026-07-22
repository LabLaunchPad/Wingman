# AI agent

**Shape:** the product itself is an agent/assistant — the "feature" is autonomous or semi-autonomous
behavior, not a traditional CRUD app.

**What changes in the pipeline:**
- Security: prompt-injection and tool-permission scoping are first-class Definition-of-Done items,
  not an afterthought — see `references/prompt-defense-baseline.md` and `security-checklist`'s
  explicit prompt-injection step.
- Architecture: model/tool-permission boundaries (what the agent can read/write/execute) are as
  load-bearing as the data model — scope them with the same rigor as a database schema.
- Evaluation: "does it work" for an agent means behavioral testing (does it do the right thing on
  real inputs), not just unit tests on deterministic code paths — budget for this explicitly.
- CFO seat: per-request/per-session model cost is a real, recurring cost line, unlike most
  traditional app compute — flag it early, not at ship time.

**Common over-scoping trap:** granting broad tool/agent permissions "to keep options open" instead
of the minimum the current feature set actually needs.
