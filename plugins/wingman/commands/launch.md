---
description: Prepare and gate public-facing launch materials — changelog, docs, announcement copy — before anything actually goes out.
argument-hint: "<what's launching, in your own words>"
---

# Wingman: Launch

After `/wingman:ship` gets code live, this is the founder-facing announcement step. Anything published here is a one-way door once it's public — you can't unsend a tweet or un-notify subscribers the way you can revert a commit. Because of that, this stage treats **every** launch artifact as needing sign-off before it goes out, not just "meaningful" ones the way `/wingman:ship`'s Boardroom checkpoint is conditional.

$ARGUMENTS

## Step 1: Activate the Growth department

Use the `department-lead-activation` skill. `dept-growth`'s activation signal is "the founder explicitly requests launch/docs/SEO copy" — invoking `/wingman:launch` at all **is** that request, so this is the one department whose signal this command itself satisfies rather than something to detect from the codebase. Create `dept-growth` if it doesn't exist yet, and delegate the drafting work below to it.

## Step 2: Draft the launch materials

Cover only what this launch actually needs — don't manufacture scope:
- **Changelog entry** — what changed, in the project's existing changelog format if one exists, plain-language framing if not.
- **Docs update** — only if this feature needs user-facing documentation to be usable; skip otherwise.
- **Announcement copy** — a short external-facing announcement, if this is worth telling users/customers about. Draft both a short version (e.g. tweet-length) and a slightly longer one, so the founder can pick.

Do not draft pricing or billing copy — that's a distinct future specialist's job (a Pricing & Billing Integration role, should one ever get promoted via `/wingman:evolve`), out of scope here.

## Step 3: Boardroom checkpoint — mandatory, not conditional

Unlike `/wingman:ship`, do not skip this for "small" launches — a public announcement can't be quietly reverted the way a merge can, so size doesn't lower the bar here. Run `/wingman:boardroom`, handing it the drafted materials directly as the review scope (this is not a diff or a plan file — see `boardroom.md`'s "What to review" step, which handles content passed directly by a calling command). Note in the boardroom checkpoint record that `stage` is `"launch"`.

## Step 4: Report and publish

Only after the Boardroom returns "ship it," show the founder the final materials and save/publish them where they belong (changelog file, docs file, or wherever the announcement actually needs to go — ask the founder if it's not obvious). Report in plain language:

```
## Launch materials ready: <one-line description>

**What's going out:** <plain language>
**Where:** <changelog / docs / announcement — wherever it's going>
**What happens next:** <e.g. "posted" or "saved as a draft for you to review and post yourself">
```

## After this

Suggest `/wingman:learn` if anything about drafting this launch is worth remembering for next time (a recurring changelog format quirk, a channel-specific copy constraint, etc.).
