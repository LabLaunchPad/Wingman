#!/usr/bin/env bash
# Fixture for testing skills/prompt-diff-check: a miniature Wingman-shaped
# project ("Portside") with two commands, each shown as "changed" via a
# before/after pair plus its eval case -- one where the existing case
# genuinely covers the changed section (should NOT be flagged), one where
# it doesn't (the real gap this skill exists to catch).
#
# Usage: evals/fixtures/setup-prompt-diff-check-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-prompt-diff-check-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/commands" "$TARGET/evals/cases"
cd "$TARGET"

git init -q

# --- Command 1: "deploy" -- changed in a way its eval case DOES cover ---
cat > commands/deploy.before.md <<'EOF'
---
description: Deploy the app to staging.
---
# Deploy
1. Run the build.
2. Push to staging.
EOF

cat > commands/deploy.md <<'EOF'
---
description: Deploy the app to staging.
---
# Deploy
1. Run the build.
2. Confirm the build succeeded before pushing (do not push a failed build).
3. Push to staging.
EOF

cat > evals/cases/deploy.md <<'EOF'
# Eval: deploy

## Expectations

| Check | Expected |
|---|---|
| Runs the build | Yes |
| Confirms build success before pushing | Yes -- refuses to push a failed build |
| Pushes to staging | Yes, only after a confirmed-successful build |
EOF

# --- Command 2: "rollback" -- changed in a way its eval case DOES NOT cover (the real gap) ---
cat > commands/rollback.before.md <<'EOF'
---
description: Roll back the last deploy.
---
# Rollback
1. Identify the previous stable version.
2. Redeploy it.
EOF

cat > commands/rollback.md <<'EOF'
---
description: Roll back the last deploy.
---
# Rollback
1. Identify the previous stable version.
2. Ask the founder for explicit confirmation before rolling back (this is a
   production-affecting action).
3. Redeploy it.
EOF

cat > evals/cases/rollback.md <<'EOF'
# Eval: rollback

## Expectations

| Check | Expected |
|---|---|
| Identifies the previous stable version | Yes |
| Redeploys the previous version | Yes |
EOF

git add -A
git commit -q -m "Initial fixture: Portside, deploy (covered change) + rollback (uncovered change)"

echo "Fixture ready at $TARGET"
