#!/usr/bin/env bash
# Negative-case fixture: "linecount", a tiny local CLI utility with
# deliberately NONE of the conditional department signals present — no
# frontend/UI, no database schema, no auth/payment code, no CI or
# containerization. Used to confirm department-lead-activation creates
# ONLY the two Always departments (Engineering, QA) and correctly
# withholds everything else, rather than over-triggering.
#
# Usage: evals/fixtures/setup-minimal-cli.sh <target-dir>
# Wipes and recreates <target-dir> every run, so the eval starts clean.

set -euo pipefail

TARGET="${1:?Usage: setup-minimal-cli.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{
  "name": "linecount",
  "private": true,
  "bin": { "linecount": "./index.js" }
}
EOF

cat > index.js <<'EOF'
#!/usr/bin/env node
// Counts non-empty lines in a text file passed as argv[2].
const fs = require("fs");
const path = process.argv[2];
if (!path) {
  console.error("Usage: linecount <file>");
  process.exit(1);
}
const lines = fs.readFileSync(path, "utf-8").split("\n").filter((l) => l.trim().length > 0);
console.log(lines.length);
EOF

cat > README.md <<'EOF'
# linecount

A tiny CLI that counts non-empty lines in a text file.

## Usage

    linecount path/to/file.txt
EOF

git add -A
git commit -q -m "Initial fixture: linecount CLI"

echo "Fixture created at $TARGET"
echo "Expected department-lead activations for this fixture:"
echo "  dept-product          -> Always (only via /wingman:plan, not tested here)"
echo "  dept-design           -> NO  (no user-facing surface — this is a CLI, no frontend)"
echo "  dept-engineering      -> Always (YES)"
echo "  dept-data             -> NO  (no schema/migrations, no database at all)"
echo "  dept-qa               -> Always (YES)"
echo "  dept-legal-security   -> NO  (no auth, no payments, no personal data)"
echo "  dept-devops           -> NO  (no CI config, no Dockerfile, never shipped)"
echo "  dept-growth           -> NO  (no explicit founder request in this scenario)"
