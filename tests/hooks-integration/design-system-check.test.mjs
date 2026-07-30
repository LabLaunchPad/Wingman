// Tests for the design-system spec validator — mechanizes visual-design-system.md's Visual Design
// System.4 gate checklist Must-include list (Layer 12 of the 19-layer validation framework).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkDesignSystemDoc, MUST_INCLUDE_CATEGORIES } from '../../plugins/wingman/scripts/design-system-check.mjs';

function completeDoc() {
  return `
## Visual design system

Typography: a small type scale.
Spacing: an 8px-based scale.
Color: primary/secondary/error/success/neutral roles.
Components: button, input, card.
Variants: default/hover/focus/disabled/error.
Tokens: exported as CSS custom properties.
Usage rules: never use a raw hex value outside the palette.
Motion: 150ms ease-out for all transitions.
Responsive rules: mobile (<640px) collapses to single column.
Accessibility rules: minimum 4.5:1 contrast, visible focus ring on every interactive element.

| ID | Token/component | Values/states | Satisfies |
|---|---|---|---|
| VS-001 | Primary button | default/hover/focus/disabled/error | WF-001 |
`;
}

test('a complete spec doc passes with no errors', () => {
  const { errors } = checkDesignSystemDoc(completeDoc());
  assert.deepEqual(errors, []);
});

test('all 10 Must-include categories are checked', () => {
  assert.equal(MUST_INCLUDE_CATEGORIES.length, 10);
});

test('removing a category is flagged by name', () => {
  const withoutMotion = completeDoc().replace(/Motion:.*\n/, '');
  const { errors } = checkDesignSystemDoc(withoutMotion);
  assert.ok(errors.some((e) => e.includes('motion')));
});

test('removing accessibility is flagged distinctly from removing responsive', () => {
  const withoutAccessibility = completeDoc().replace(/Accessibility rules:.*\n/, '');
  const { errors: accessibilityErrors } = checkDesignSystemDoc(withoutAccessibility);
  assert.ok(accessibilityErrors.some((e) => e.includes('accessibility')));
  assert.ok(!accessibilityErrors.some((e) => e.includes('"responsive"')));

  const withoutResponsive = completeDoc().replace(/Responsive rules:.*\n/, '');
  const { errors: responsiveErrors } = checkDesignSystemDoc(withoutResponsive);
  assert.ok(responsiveErrors.some((e) => e.includes('responsive')));
  assert.ok(!responsiveErrors.some((e) => e.includes('"accessibility"')));
});

test('a doc with no VS-* row is flagged', () => {
  const noVsRow = completeDoc().replace(/\| VS-001.*\n/, '');
  const { errors } = checkDesignSystemDoc(noVsRow);
  assert.ok(errors.some((e) => e.includes('VS-*')));
});

test('multiple missing categories all get their own error', () => {
  const sparse = 'Just talks about typography and color, nothing else.';
  const { errors } = checkDesignSystemDoc(sparse);
  assert.ok(errors.length >= 8);
});
