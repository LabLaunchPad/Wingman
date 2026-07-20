#!/usr/bin/env bash
# Positive-case fixture for evals/cases/platform-native-reference.md: a
# small web app with a founder request to add a date-picker library, where
# the native <input type="date"> element already covers the need -- plus
# two more native-vs-library temptations (clamp() for responsive font size,
# structuredClone for a deep copy currently done via a library).
#
# Usage: evals/fixtures/setup-platform-native-reference-fixture.sh <target-dir>
# Wipes and recreates <target-dir> every run.

set -euo pipefail

TARGET="${1:?Usage: setup-platform-native-reference-fixture.sh <target-dir>}"

rm -rf "$TARGET"
mkdir -p "$TARGET/src"
cd "$TARGET"

git init -q

cat > package.json <<'EOF'
{ "name": "date-picker-app", "version": "0.1.0", "private": true }
EOF

cat > FOUNDER_REQUEST.md <<'EOF'
# Founder Request

"Can we add a date picker library to the signup form? I want users to be able to pick their
birthday from a calendar widget instead of typing it."

Also: the signup card's heading text is a fixed 24px on mobile and 32px on desktop via two
separate media-query breakpoints -- founder wants it to scale more smoothly between sizes.

Also: `src/copyProfile.js` currently uses `JSON.parse(JSON.stringify(profile))` to deep-clone a
user profile object before editing it, to avoid mutating the original.
EOF

cat > src/signup.html <<'EOF'
<form>
  <label>Birthday</label>
  <input type="text" id="birthday" placeholder="MM/DD/YYYY">
</form>
EOF

cat > src/copyProfile.js <<'EOF'
function copyProfile(profile) {
  return JSON.parse(JSON.stringify(profile));
}
module.exports = copyProfile;
EOF

git add -A
git commit -q -m "Initial fixture: date-picker-app, a founder request where native platform features already cover the need"

echo "Fixture ready at $TARGET"
