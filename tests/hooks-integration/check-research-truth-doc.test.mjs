// Tests for scripts/check-research-truth-doc.mjs -- the mechanical consumer behind
// skills/research-gate. A real bug was found running this checker against the two real TRUTH
// docs authored in the same PR: both used a modified field label ("Our Improvements over the
// general RAG pattern:") instead of the template's exact "Our Improvements:", so the checker
// correctly flagged both as incomplete. Fixed in the docs, not the checker -- the checker was
// right to be strict.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { checkTruthDoc } from '../../scripts/check-research-truth-doc.mjs';

function makeCompleteDoc(overrides = {}) {
  const sections = {
    pioneers: 'A named pioneer.',
    implementations: 'A real implementation, checked directly.',
    community: 'Real community feedback.',
    tradeoffs: 'Real trade-off analysis.',
    principle: 'A real principle.',
    architecture: 'A real architecture.',
    improvements: 'A real improvement.',
    wontDo: 'A real declined alternative.',
    openQuestions: 'A real open question.',
    references: '- [Source](https://example.com)',
    ...overrides,
  };
  return `# Engineering Truth: Example

## Problem

An example problem.

## 1. The Pioneers

${sections.pioneers}

## 2. Current Best Implementations

${sections.implementations}

## 3. Community Experience

${sections.community}

## 4. Engineering Trade-offs

${sections.tradeoffs}

## 5. Our Synthesis

**Our Principle:** ${sections.principle}

**Our Architecture:** ${sections.architecture}

**Our Improvements:** ${sections.improvements}

**What We Will Not Do:** ${sections.wontDo}

**Open Questions:** ${sections.openQuestions}

## References

${sections.references}
`;
}

test('a genuinely complete document passes with zero problems', () => {
  assert.deepEqual(checkTruthDoc(makeCompleteDoc()), []);
});

test('a missing top-level section (e.g. no Community Experience) is named specifically', () => {
  const doc = makeCompleteDoc().replace('## 3. Community Experience\n\nReal community feedback.\n\n', '');
  const problems = checkTruthDoc(doc);
  assert.ok(problems.some((p) => p.includes('## 3. Community Experience')));
});

test('a section header with nothing under it is flagged as no content, not just missing', () => {
  const doc = makeCompleteDoc().replace('A real implementation, checked directly.', '');
  const problems = checkTruthDoc(doc);
  assert.ok(problems.some((p) => p.includes('## 2. Current Best Implementations') && p.includes('no content')));
});

test('the exact real bug this checker caught: a renamed synthesis field is flagged', () => {
  const doc = makeCompleteDoc().replace('**Our Improvements:**', '**Our Improvements over the general pattern:**');
  const problems = checkTruthDoc(doc);
  assert.ok(problems.some((p) => p.includes('"Our Improvements" field')));
});

test('an empty synthesis field is flagged even when the label is present', () => {
  const doc = makeCompleteDoc({ openQuestions: '' });
  const problems = checkTruthDoc(doc);
  assert.ok(problems.some((p) => p.includes('"Open Questions" field is empty')));
});

test('a missing References section is flagged -- every claim must trace to a source', () => {
  const doc = makeCompleteDoc().replace('## References\n\n- [Source](https://example.com)\n', '');
  const problems = checkTruthDoc(doc);
  assert.ok(problems.some((p) => p.includes('References')));
});

test('every real TRUTH-*.md document in research/ passes the checker', () => {
  const researchRoot = join(process.cwd(), 'research');
  let anyChecked = false;
  for (const domain of readdirSync(researchRoot, { withFileTypes: true })) {
    if (!domain.isDirectory()) continue;
    const domainDir = join(researchRoot, domain.name);
    for (const f of readdirSync(domainDir)) {
      if (!f.startsWith('TRUTH-') || !f.endsWith('.md')) continue;
      anyChecked = true;
      const problems = checkTruthDoc(readFileSync(join(domainDir, f), 'utf-8'));
      assert.deepEqual(problems, [], `${domain.name}/${f} should be complete: ${problems.join('; ')}`);
    }
  }
  assert.ok(anyChecked, 'expected at least one real TRUTH-*.md to exist and be checked');
});
