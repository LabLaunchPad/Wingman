#!/usr/bin/env node
// Dev-repo-only (like check-repo-consistency.mjs, wingman-health.mjs) -- research/ never ships
// with the plugin, so this check has no reason to run inside a founder's installed project.
//
// Gives skills/research-gate a mechanical consumer: names exactly which of the 5 studies (per
// research/template-truth-doc.md) is missing from a given TRUTH-*.md, rather than a maintainer
// eyeballing completeness. Also guards against the one failure mode this gate exists to prevent --
// a document with headers but no real content, which "looks complete" without being researched.
//
// Usage: node scripts/check-research-truth-doc.mjs research/<domain>/TRUTH-<capability>.md
//        node scripts/check-research-truth-doc.mjs --all   # check every real TRUTH-*.md in research/

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// The 5 required sections, in the exact heading text research/template-truth-doc.md uses.
const REQUIRED_SECTIONS = [
  '## 1. The Pioneers',
  '## 2. Current Best Implementations',
  '## 3. Community Experience',
  '## 4. Engineering Trade-offs',
  '## 5. Our Synthesis',
];

// Sub-fields inside "Our Synthesis" that must each carry real content, not just a bare label.
const SYNTHESIS_FIELDS = [
  'Our Principle',
  'Our Architecture',
  'Our Improvements',
  'What We Will Not Do',
  'Open Questions',
];

/**
 * @param {string} text  contents of a TRUTH-*.md file
 * @returns {string[]} problems; empty if the document is genuinely complete
 */
export function checkTruthDoc(text) {
  const problems = [];

  for (const heading of REQUIRED_SECTIONS) {
    const idx = text.indexOf(heading);
    if (idx === -1) {
      problems.push(`missing required section: "${heading}"`);
      continue;
    }
    // Content between this heading and the next "## " heading must be more than whitespace.
    const rest = text.slice(idx + heading.length);
    const nextHeadingIdx = rest.search(/\n## /);
    const body = (nextHeadingIdx === -1 ? rest : rest.slice(0, nextHeadingIdx)).trim();
    if (body.length === 0) {
      problems.push(`section "${heading}" has no content -- a header with nothing under it is not research`);
    }
  }

  const synthesisIdx = text.indexOf('## 5. Our Synthesis');
  if (synthesisIdx !== -1) {
    const synthesisEnd = text.indexOf('\n## ', synthesisIdx + 1);
    const synthesisBlock = synthesisEnd === -1 ? text.slice(synthesisIdx) : text.slice(synthesisIdx, synthesisEnd);
    for (const field of SYNTHESIS_FIELDS) {
      const marker = `**${field}:**`;
      const fieldIdx = synthesisBlock.indexOf(marker);
      if (fieldIdx === -1) {
        problems.push(`"Our Synthesis" is missing the "${field}" field`);
        continue;
      }
      const afterField = synthesisBlock.slice(fieldIdx + marker.length);
      const nextFieldIdx = afterField.search(/\n\*\*/);
      const fieldBody = (nextFieldIdx === -1 ? afterField : afterField.slice(0, nextFieldIdx)).trim();
      if (fieldBody.length === 0) {
        problems.push(`"Our Synthesis"'s "${field}" field is empty`);
      }
    }
  }

  if (!text.includes('## References')) {
    problems.push('missing "## References" section -- every claim must be traceable to a real source');
  }

  return problems;
}

function findAllTruthDocs(researchRoot) {
  const found = [];
  let domains;
  try { domains = readdirSync(researchRoot, { withFileTypes: true }); } catch { return found; }
  for (const entry of domains) {
    if (!entry.isDirectory()) continue;
    const domainDir = join(researchRoot, entry.name);
    let files;
    try { files = readdirSync(domainDir); } catch { continue; }
    for (const f of files) {
      if (f.startsWith('TRUTH-') && f.endsWith('.md')) found.push(join(domainDir, f));
    }
  }
  return found;
}

function main() {
  const args = process.argv.slice(2);
  const researchRoot = 'research';

  if (args.includes('--all')) {
    const docs = findAllTruthDocs(researchRoot);
    if (docs.length === 0) {
      console.log('No TRUTH-*.md documents found under research/ -- nothing to check.');
      process.exit(0);
    }
    let anyFailed = false;
    for (const doc of docs) {
      const problems = checkTruthDoc(readFileSync(doc, 'utf-8'));
      if (problems.length) {
        anyFailed = true;
        console.log(`FAIL  ${doc}`);
        for (const p of problems) console.log(`  - ${p}`);
      } else {
        console.log(`PASS  ${doc}`);
      }
    }
    process.exit(anyFailed ? 1 : 0);
  }

  const target = args[0];
  if (!target) {
    console.error('Usage: node scripts/check-research-truth-doc.mjs <path-to-TRUTH-doc.md>');
    console.error('       node scripts/check-research-truth-doc.mjs --all');
    process.exit(2);
  }
  if (!existsSync(target)) {
    console.log(`No document at "${target}" -- research has not started. Missing all 5 studies:`);
    for (const s of REQUIRED_SECTIONS) console.log(`  - ${s}`);
    process.exit(1);
  }

  const problems = checkTruthDoc(readFileSync(target, 'utf-8'));
  if (problems.length) {
    console.log(`${problems.length} problem(s) in ${target}:`);
    for (const p of problems) console.log(`  - ${p}`);
    console.log('\nFAIL');
    process.exit(1);
  }
  console.log(`${target}: all 5 studies present with real content.\nPASS`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
