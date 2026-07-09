#!/usr/bin/env bash
# "Pricer" — a small Node project whose test suite is a rubber stamp: it always
# exits 0 regardless of whether the code is correct, and there's a real bug it
# never catches. Tests /wingman:harness's ability to say "no, don't trust this."
set -euo pipefail

TARGET_DIR="${1:?Usage: setup-harness-fake-fixture.sh <target-dir>}"

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR/src"
cd "$TARGET_DIR"

git init -q
git config user.email "test@example.com"
git config user.name "Test"

cat > package.json <<'EOF'
{
  "name": "pricer",
  "version": "1.0.0",
  "scripts": {
    "test": "node test/run.js",
    "start": "node src/index.js"
  }
}
EOF

# Real bug: applyDiscount doesn't clamp, so a discount over 100% yields a
# negative price. Nothing in this project ever checks that.
cat > src/pricing.js <<'EOF'
function applyDiscount(price, percentOff) {
  return price - (price * percentOff / 100);
}

module.exports = { applyDiscount };
EOF

cat > src/index.js <<'EOF'
const { applyDiscount } = require('./pricing');
console.log(applyDiscount(100, 10));
EOF

mkdir -p test
# The "test suite": always prints a green summary and exits 0, regardless of
# what the code actually does. Never imports or calls anything real.
cat > test/run.js <<'EOF'
console.log('4 passing (2ms)');
process.exit(0);
EOF

cat > README.md <<'EOF'
# Pricer

Price and discount calculations. Run `npm test` — full coverage, always green.
EOF

git add -A
git commit -q -m "Initial commit: pricer with rubber-stamp test suite"

echo "Fixture ready at $TARGET_DIR"
