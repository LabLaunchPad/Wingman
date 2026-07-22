#!/usr/bin/env node
// Confirms CHANGELOG.md has a "## [<version>]" heading matching a given version string.
// Used by .github/workflows/version-gate.yml to catch a plugin.json version bump with no
// corresponding CHANGELOG entry -- previously that gap passed CI silently (version-gate.yml only
// ever diffed plugin.json's version field, never cross-checked CHANGELOG.md at all).
//
// Usage: node check-changelog-entry.mjs <version> [changelog-path]
//   exit 0 = matching entry found, exit 1 = not found

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function hasChangelogEntry(changelogText, version) {
  const heading = `## [${version}]`;
  return changelogText.includes(heading);
}

function main() {
  const [version, changelogPath = 'CHANGELOG.md'] = process.argv.slice(2);
  if (!version) {
    console.error('Usage: node check-changelog-entry.mjs <version> [changelog-path]');
    process.exit(2);
  }

  const text = readFileSync(changelogPath, 'utf-8');
  if (!hasChangelogEntry(text, version)) {
    console.error(
      `${changelogPath}: no "## [${version}]" entry found -- plugin.json was bumped to ${version} but CHANGELOG.md was not updated to match.`
    );
    process.exit(1);
  }

  console.log(`✓ ${changelogPath} has a matching [${version}] entry`);
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
