#!/usr/bin/env node
// Generates/verifies evals/MANIFEST.tsv — one line per evals/cases/*.md case:
// case name, the fixture it runs against (or a no-fixture-needed reason), and
// what it covers (a real command/skill/script/hook path).
//
// Why generated, not hand-authored: `wingman-health.mjs` used to infer
// coverage from filename-prefix matching plus one hardcoded alias
// (`audit` -> `systematic-auditing`), a heuristic that keeps needing patched
// exceptions as the suite grows (audit-reorg-2026-07-20.md action item #3).
// Every case already states its own "covers" and fixture explicitly in its
// own body (a `Tests \`<path>\`` opening line, and either a
// `evals/fixtures/setup-*.sh` reference or a
// `<!-- eval:no-fixture-needed: <reason> -->` marker) — this script extracts
// that ground truth mechanically instead of re-deriving or hand-typing it,
// so the manifest can never drift out of sync with what a case actually says
// about itself. `--check` (used by check-repo-consistency.mjs) regenerates
// and diffs against the committed file rather than trusting it was kept
// current by hand.

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const caseDir = join(repoRoot, 'evals', 'cases');
const manifestPath = join(repoRoot, 'evals', 'MANIFEST.tsv');

const RETIRED = /\*\*Status: retired, not deleted\*\*/;
const FIXTURE_RE = /evals\/fixtures\/setup-[a-zA-Z0-9_-]+\.sh/;
const NO_FIXTURE_RE = /<!--\s*eval:no-fixture-needed:\s*(.+?)\s*-->/;
// Captures the whole "Tests ..." opening sentence (up to the first " — " or
// line break, whichever comes first — sentences run past the first "."
// inside a path like "SKILL.md"), then pulls every backtick-quoted path out
// of it, since several cases test 2 files (e.g. a skill + the command that
// invokes it).
const COVERS_SENTENCE_RE = /Tests\s+.*?(?=\s+—|\.\s|\.$|\n|$)/;
const COVERS_PROSE_RE = /Tests\s+(?:the\s+)?([^.\n]+)/;

export function buildManifest() {
  const files = existsSync(caseDir)
    ? readdirSync(caseDir).filter((f) => f.endsWith('.md')).sort()
    : [];
  const rows = [];
  for (const file of files) {
    const name = file.replace(/\.md$/, '');
    const text = readFileSync(join(caseDir, file), 'utf-8');
    const body = text.replace(/^#.*\n/, ''); // drop the "# Eval: name" heading

    if (RETIRED.test(body)) {
      rows.push({ name, fixture: '(retired)', covers: '(retired)' });
      continue;
    }

    const fixtureMatch = body.match(FIXTURE_RE);
    const noFixtureMatch = body.match(NO_FIXTURE_RE);
    const fixture = fixtureMatch
      ? fixtureMatch[0]
      : noFixtureMatch
        ? `(none: ${noFixtureMatch[1]})`
        : '(MISSING — no fixture and no no-fixture-needed marker)';

    const sentenceMatch = body.match(COVERS_SENTENCE_RE);
    const paths = sentenceMatch ? [...sentenceMatch[0].matchAll(/`([^`]+)`/g)].map((m) => m[1]) : [];
    let covers;
    if (paths.length) {
      covers = paths.join('; ');
    } else {
      const proseMatch = body.match(COVERS_PROSE_RE);
      covers = proseMatch ? proseMatch[1].trim() : '(MISSING — no "Tests ..." opening line)';
    }

    rows.push({ name, fixture, covers });
  }
  return rows;
}

export function renderManifest(rows) {
  const header = 'case\tfixture\tcovers';
  const lines = rows.map((r) => `${r.name}\t${r.fixture}\t${r.covers}`);
  return [header, ...lines].join('\n') + '\n';
}

function main() {
  const rows = buildManifest();
  const rendered = renderManifest(rows);
  const mode = process.argv[2];

  if (mode === '--check') {
    const current = existsSync(manifestPath) ? readFileSync(manifestPath, 'utf-8') : null;
    if (current !== rendered) {
      console.error('evals/MANIFEST.tsv is stale — regenerate with: node scripts/generate-eval-manifest.mjs --write');
      process.exit(1);
    }
    console.log(`evals/MANIFEST.tsv is current (${rows.length} cases).`);
    return;
  }

  if (mode === '--write') {
    writeFileSync(manifestPath, rendered);
    console.log(`Wrote evals/MANIFEST.tsv (${rows.length} cases).`);
    return;
  }

  process.stdout.write(rendered);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
