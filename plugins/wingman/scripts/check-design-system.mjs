#!/usr/bin/env node
// Design-system spec validator. Ships with the plugin (like check-traceability.mjs) so a founder's
// own project can run it against its own visual-design-system doc.
//
// Mechanizes visual-design-system.md's Visual Design System.4 gate checklist's Must-include list:
// confirms all 10 categories (typography, spacing, color, components, variants, tokens, usage
// rules, motion, responsive, accessibility) are named in the doc, and at least one VS-* row exists.
// Does not, and cannot, judge whether the system is actually "consistent and reusable across
// screens" -- that judgment call stays with the founder checkpoint. Component-consistency checking
// and token-value linting (contrast ratios, spacing math) are deliberately NOT built here: no
// evidenced need yet, per this project's evidence-gated-catalog discipline.
//
// Usage: node check-design-system.mjs <path-to-visual-design-system-doc.md>

import { readFileSync } from 'node:fs';
import { checkDesignSystemDoc } from './design-system-check.mjs';

function main() {
  const docPath = process.argv[2];
  if (!docPath) {
    console.error('Usage: node check-design-system.mjs <path-to-visual-design-system-doc.md>');
    process.exit(2);
  }

  let text;
  try {
    text = readFileSync(docPath, 'utf8');
  } catch (err) {
    console.error(`Could not read ${docPath}: ${err.message}`);
    process.exit(2);
  }

  const { errors, warnings } = checkDesignSystemDoc(text);

  if (warnings.length) {
    console.log(`${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  - ${w}`);
  }

  if (errors.length) {
    console.log(`${errors.length} error(s):`);
    for (const e of errors) console.log(`  - ${e}`);
    console.log('\nFAIL');
    process.exit(1);
  }

  console.log(`Design system spec ${docPath}: all 10 Must-include categories present, VS-* row(s) found.`);
  console.log('\nPASS');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
