# Mini SaaS

**Shape:** a single-feature paid tool — one or two screens, a narrow, well-understood user base.

**What changes in the pipeline:**
- Discovery: validate willingness to pay for *this one thing* specifically — a mini SaaS lives or
  dies on one feature being worth a subscription, not on breadth.
- Architecture: resist adding infrastructure sized for a full SaaS (multi-tenant complexity, a
  microservice split) before there's evidence of the scale that would justify it.
- CFO seat: cost-per-user and pricing-vs-infra-cost sanity checks matter more here than for an
  internal tool or website — this is exactly what the Boardroom CFO seat exists to catch.
- Ship: a fast, low-friction path to first paying user matters more than feature completeness.

**Common over-scoping trap:** building the full-SaaS feature set "so it's ready to grow into" before
the one core feature has paying users.
