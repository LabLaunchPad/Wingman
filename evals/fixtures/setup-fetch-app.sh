#!/usr/bin/env bash
# Creates a throwaway, realistic test fixture: "Fetch", a hypothetical dog
# meal-plan subscription app. Deliberately includes signals for Design,
# Data, Legal/Security, and DevOps (Engineering and QA are "Always" and
# need no fixture signal), and deliberately omits a Growth signal (that
# department only activates on an explicit founder request, never
# inferred) and any prior ship record (so DevOps activation comes from
# the Dockerfile/CI files, not a "shipped before" checkpoint).
#
# Usage: evals/fixtures/setup-fetch-app.sh <target-dir>
# Wipes and recreates <target-dir> every run, so the eval starts clean.

set -euo pipefail

TARGET="${1:?Usage: setup-fetch-app.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET"
cd "$TARGET"

git init -q

# --- Design signal: a Next.js frontend with real components ---
mkdir -p src/app src/components
cat > package.json <<'EOF'
{
  "name": "fetch-app",
  "private": true,
  "dependencies": { "next": "^14.0.0", "react": "^18.0.0", "@prisma/client": "^5.0.0", "stripe": "^14.0.0" }
}
EOF
cat > src/app/page.tsx <<'EOF'
export default function HomePage() {
  return <main><h1>Fetch — meal plans for dogs</h1></main>;
}
EOF
cat > src/components/PlanCard.tsx <<'EOF'
export function PlanCard({ name, price }: { name: string; price: number }) {
  return <div className="plan-card"><h3>{name}</h3><p>${price}/mo</p></div>;
}
EOF

# --- Data signal: a Prisma schema with migrations ---
mkdir -p prisma/migrations/20260101000000_init
cat > prisma/schema.prisma <<'EOF'
model Dog {
  id     String @id @default(uuid())
  name   String
  weight Int
}
model Plan {
  id    String @id @default(uuid())
  dogId String
  price Int
}
EOF
echo "-- initial schema" > prisma/migrations/20260101000000_init/migration.sql

# --- Legal/Security signal: auth + billing code ---
mkdir -p src/auth src/billing
cat > src/auth/session.ts <<'EOF'
export function createSession(userId: string) {
  // sets an httpOnly session cookie
  return { userId, token: "placeholder" };
}
EOF
cat > src/billing/stripe.ts <<'EOF'
import Stripe from "stripe";
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
export async function chargeCustomer(customerId: string, amountCents: number) {
  return stripe.charges.create({ customer: customerId, amount: amountCents, currency: "usd" });
}
EOF

# --- DevOps signal: Dockerfile + CI config ---
cat > Dockerfile <<'EOF'
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]
EOF
mkdir -p .github/workflows
cat > .github/workflows/ci.yml <<'EOF'
name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
EOF

# Deliberately NOT created: .wingman/checkpoints.jsonl (no prior ship),
# any explicit Growth-department request, any pre-existing .claude/agents/.

git add -A
git commit -q -m "Initial fixture: Fetch app"

# Fixture-signal-integrity manifest (see scripts/check-fixtures.mjs, FIXLOG.md
# T4): lists the specific signal files this fixture promises to plant, so the
# deterministic CI gate catches it if a future edit silently drops one of
# them, rather than the fixture still running "cleanly" with a weaker signal
# than its own case file claims. Written after the commit, deliberately not
# part of the fixture's own git history -- it's checker metadata, not
# simulated project content a subagent inspecting this fixture should see.
cat > .wingman-fixture-manifest <<'EOF'
Dockerfile
.github/workflows/ci.yml
package.json
EOF

echo "Fixture created at $TARGET"
echo "Expected department-lead activations for this fixture:"
echo "  dept-product          -> Always (only via /wingman:plan, not tested here)"
echo "  dept-design           -> YES (Next.js pages/components present)"
echo "  dept-engineering      -> Always (YES)"
echo "  dept-data             -> YES (prisma schema + migrations present)"
echo "  dept-qa               -> Always (YES)"
echo "  dept-legal-security   -> YES (auth + Stripe billing code present)"
echo "  dept-devops           -> YES (Dockerfile + .github/workflows present)"
echo "  dept-growth           -> NO  (no explicit founder request in this scenario)"
