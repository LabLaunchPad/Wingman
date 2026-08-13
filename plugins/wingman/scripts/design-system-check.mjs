// Pure check for the design-system spec's 10 Must-include categories (see
// commands/pipeline/visual-design-system.md Visual Design System.4's gate checklist). Imported by
// check-design-system.mjs, which supplies the real founder-project doc text, and by tests, which
// supply fake doc text.
//
// The rule: a visual-design-system spec doc must name all 10 Must-include categories somewhere in
// its text, and mint at least one `VS-*` traceability row. This mechanizes the gate checklist's own
// "Gate passes only if the system is consistent and reusable across screens" rule at the category
// level -- it cannot judge consistency/reusability itself (that's still the founder checkpoint's
// job), only that nothing was silently skipped.
//
// Split from the I/O for the same reason engines-check.mjs/wkos-check.mjs are: a validator that
// runs its whole pass at import time cannot be tested without executing it as a side effect.

export const MUST_INCLUDE_CATEGORIES = [
  'typography',
  'spacing',
  'color',
  'components',
  'variants',
  'tokens',
  'usage rules',
  'motion',
  'responsive',
  'accessibility',
];

const VS_ROW_PATTERN = /\bVS-\d+\b/;

/**
 * @param {string} text  a founder project's visual-design-system spec doc contents
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function checkDesignSystemDoc(text) {
  const errors = [];
  const warnings = [];
  const lower = text.toLowerCase();

  for (const category of MUST_INCLUDE_CATEGORIES) {
    if (!lower.includes(category)) {
      errors.push(`missing Must-include category: "${category}" is not named anywhere in the spec`);
    }
  }

  if (!VS_ROW_PATTERN.test(text)) {
    errors.push('no VS-* traceability row found -- the spec must mint at least one VS-* ID');
  }

  return { errors, warnings };
}
