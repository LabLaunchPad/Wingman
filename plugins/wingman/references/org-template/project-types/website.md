# Website

**Shape:** marketing/informational site — no user accounts, no persistent app state beyond a
contact form or newsletter signup.

**What changes in the pipeline:**
- Discovery: success signal is almost always a business-outcome metric (leads, signups, bookings),
  not a feature list — push past "we need a website" to what it should make happen.
- Architecture: usually the lightest stage in the pipeline — static/SSG hosting is often sufficient;
  don't scope a database or auth unless a real requirement (e.g. gated content) demands one.
- UX flow: content hierarchy and conversion path matter more than interaction design.
- Build/Ship: accessibility and page-load performance are the concrete, checkable bars — see
  `references/accessibility-checklist.md`.

**Common over-scoping trap:** adding a CMS, user accounts, or a custom admin panel before there's
a real need for content to change more often than a founder can edit a file directly.
