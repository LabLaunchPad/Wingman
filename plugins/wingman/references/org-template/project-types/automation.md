# Automation

**Shape:** an internal script or workflow with no end-user-facing surface — runs on a schedule or
trigger, nobody clicks through a UI to use it.

**What changes in the pipeline:**
- UX flow: usually skippable entirely — there's no user-facing flow to diagram. Note this explicitly
  in the Planning Milestone checkpoint rather than silently omitting the stage.
- Discovery: success signal is almost always "did the manual task go away," a concretely observable
  before/after — push for the actual current manual process, not an assumed one.
- Testing: failure mode matters more than feature completeness — what happens when the automation's
  upstream data source is missing or malformed is a real requirement, not an edge case to defer.
- Definition of Done: monitoring/alerting on failure (so a silent break gets noticed) is part of
  Done for anything unattended, not a nice-to-have.

**Common under-scoping trap:** no failure-path handling at all, because the happy path was the only
thing demoed during discovery.
