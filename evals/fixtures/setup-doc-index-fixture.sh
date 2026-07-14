#!/usr/bin/env bash
# Fixture for testing skills/doc-index: a miniature Wingman-shaped project
# ("Fleetdesk") with its own tiny commands/skills/references layout, where
# one reference doc under references/ is a genuine orphan -- fully written,
# accurate, but cited by nothing anywhere in commands/ or skills/ -- exactly
# the v10 doc-index finding this skill was codified from. Two other
# reference docs ARE properly cross-linked, so the fixture isn't a trivial
# "everything is broken" case; the orphan has to be found among real,
# correctly-wired docs.
#
# Usage: evals/fixtures/setup-doc-index-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-doc-index-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/commands" "$TARGET/skills/rate-limit-review" "$TARGET/references"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "fleetdesk",
  "version": "0.1.0",
  "private": true,
  "description": "A tiny Wingman-shaped plugin project used to test doc-index discipline."
}
EOF

# Reference 1: properly cross-linked from a command.
cat > references/deploy-checklist.md <<'EOF'
# Deploy Checklist — Cross-Reference

Steps to verify before a deploy: build succeeds, migrations applied, health
check green, rollback plan documented.
EOF

# Reference 2: properly cross-linked from a skill.
cat > references/rate-limit-tuning.md <<'EOF'
# Rate Limit Tuning — Cross-Reference

Guidance for setting per-route rate limits: baseline at p95 traffic + 20%
headroom, alert at 80% of the configured ceiling.
EOF

# Reference 3: THE ORPHAN. Fully written, accurate content, but not cited
# anywhere in commands/ or skills/ below -- a dead doc nobody is ever
# pointed to.
cat > references/incident-severity-matrix.md <<'EOF'
# Incident Severity Matrix — Cross-Reference

Defines SEV1 (full outage, all customers), SEV2 (degraded, subset of
customers), SEV3 (cosmetic/minor, no customer-facing impact) and the
expected response-time ceiling for each.
EOF

cat > commands/deploy.md <<'EOF'
---
name: deploy
description: Deploys the current build after a checklist pass.
---

# Deploy

Run the deploy checklist before promoting a build.

## References

- `references/deploy-checklist.md` — consult before every deploy to confirm build, migrations, health check, and rollback plan.
EOF

cat > skills/rate-limit-review/SKILL.md <<'EOF'
---
name: rate-limit-review
description: Use when adding or changing a rate-limited route.
---

# Rate Limit Review

Set and verify per-route rate limits before shipping a new endpoint.

## References

- `references/rate-limit-tuning.md` — consult when choosing a limit for a new or changed route.
EOF

cat > README.md <<'EOF'
# Fleetdesk

A tiny internal plugin project: one deploy command, one rate-limit-review
skill, and a set of cross-reference docs under `references/`.
EOF

git add -A
git commit -q -m "Initial fleetdesk project: deploy command, rate-limit-review skill, 3 reference docs"

echo "Fixture created at $TARGET"
echo "Reference docs present: deploy-checklist.md (cited by commands/deploy.md),"
echo "rate-limit-tuning.md (cited by skills/rate-limit-review/SKILL.md),"
echo "and incident-severity-matrix.md (the orphan -- written, accurate, cited by nothing)."
echo "Expected: a doc-index audit greps each references/*.md basename across commands/ and skills/"
echo "and finds incident-severity-matrix.md has zero citations anywhere."
