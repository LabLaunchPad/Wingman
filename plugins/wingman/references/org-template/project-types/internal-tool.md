# Internal tool

**Shape:** used by the founder's own team, never sold or shown externally.

**What changes in the pipeline:**
- Discovery: the founder often *is* the primary user — resist skipping the discovery questions just
  because "I already know what I want," since the same wrong-problem risk applies to internal tools.
- Design: usually the lowest-priority department-lead activation signal of all 7 types — a rough,
  functional UI is often the right call; don't let `design-taste` push polish nobody outside the
  team will see.
- Security: still real (internal tools handle real internal data) but the threat model is narrower —
  `security-checklist`'s STRIDE pass should reflect an internal-only trust boundary, not treat it
  identically to a public-facing product.
- Ship: "shipped" usually means "the team is actually using it," not a public release — the Ship
  checkpoint's bar should be adjusted to that reality.

**Common over-scoping trap:** building account/permission systems sized for external users when the
whole team already has one shared login's worth of trust.
