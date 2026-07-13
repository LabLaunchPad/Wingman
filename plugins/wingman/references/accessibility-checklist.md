# Accessibility Checklist — Cross-Skill Reference

Applied by the Design seat at every Boardroom checkpoint for any task involving UI, markup, or user interaction. WCAG 2.1 AA is the baseline. Every item must be verified with evidence.

---

## 1. WCAG 2.1 AA Compliance

### Perceivable

| Criterion | Requirement | Verification |
|-----------|------------|-------------|
| 1.1.1 Non-text Content | All images have meaningful `alt` text; decorative images use `alt=""` | Inspect DOM; screen reader test |
| 1.2.1 Audio/Video | Captions for prerecorded audio; audio descriptions for video | Media review |
| 1.3.1 Info & Relationships | Semantic HTML: headings, lists, tables, landmarks used correctly | Validator + screen reader |
| 1.3.2 Meaningful Sequence | DOM order matches visual order | CSS reflow test |
| 1.3.3 Sensory Characteristics | Instructions don't rely solely on shape, color, size, or position | Content review |
| 1.4.1 Use of Color | Color is not the only means of conveying information | Grayscale test |
| 1.4.3 Contrast Minimum | 4.5:1 for normal text, 3:1 for large text | Contrast checker tool |
| 1.4.4 Resize Text | Content readable at 200% zoom without horizontal scroll | Browser zoom test |
| 1.4.5 Images of Text | No images of text (logos excepted) | Visual inspection |
| 1.4.10 Reflow | Content reflows at 320px width without horizontal scroll | Responsive test |
| 1.4.11 Non-text Contrast | 3:1 for UI components and graphical objects | Contrast checker |
| 1.4.12 Text Spacing | Content adapts to increased line height, letter spacing, word spacing | Text spacing override test |

### Operable

| Criterion | Requirement | Verification |
|-----------|------------|-------------|
| 2.1.1 Keyboard | All functionality available via keyboard | Tab through entire UI |
| 2.1.2 No Keyboard Trap | Focus can always move away from any component | Tab/Shift+Tab test |
| 2.4.1 Bypass Blocks | Skip navigation link present | Keyboard test |
| 2.4.2 Page Titled | Every page has a descriptive `<title>` | Inspect `<head>` |
| 2.4.3 Focus Order | Focus order is logical and intuitive | Tab order test |
| 2.4.4 Link Purpose | Link text is descriptive (no "click here", "read more") | Content review |
| 2.4.5 Multiple Ways | Multiple navigation methods (search, nav, sitemap) | Site structure review |
| 2.4.6 Headings & Labels | Headings and labels are descriptive | Content review |
| 2.4.7 Focus Visible | Focus indicator is clearly visible on all interactive elements | Keyboard test in all themes |

### Understandable

| Criterion | Requirement | Verification |
|-----------|------------|-------------|
| 3.1.1 Language of Page | `lang` attribute set on `<html>` | Inspect DOM |
| 3.1.2 Language of Parts | Language changes marked with `lang` attribute | Inspect DOM |
| 3.2.1 On Focus | No unexpected context changes on focus | Tab test |
| 3.2.2 On Input | No unexpected context changes on input (unless warned) | Form test |
| 3.3.1 Error Identification | Errors identified in text, not just color | Submit invalid form |
| 3.3.2 Labels or Instructions | All form inputs have visible labels or instructions | Form review |
| 3.3.3 Error Suggestion | Error messages suggest corrections when possible | Form test |
| 3.3.4 Error Prevention | Submissions reviewed, confirmed, or reversible | Critical form test |

### Robust

| Criterion | Requirement | Verification |
|-----------|------------|-------------|
| 4.1.1 Parsing | Valid HTML (no duplicate IDs, proper nesting) | HTML validator |
| 4.1.2 Name, Role, Value | Custom components expose correct ARIA roles, states, properties | Screen reader + axe |
| 4.1.3 Status Messages | Status updates use ARIA live regions | Screen reader test |

---

## 2. Keyboard Navigation

### Requirements

- [ ] All interactive elements reachable via Tab
- [ ] Tab order follows logical reading order (left-to-right, top-to-bottom for LTR)
- [ ] Focus indicator visible on every focusable element (never `outline: none` without replacement)
- [ ] Escape closes modals, dropdowns, and popovers
- [ ] Arrow keys navigate within composite widgets (tabs, menus, listboxes)
- [ ] Enter/Space activates buttons and links
- [ ] No keyboard traps (focus can always escape)
- [ ] Skip navigation link present and functional

### Common keyboard patterns

| Component | Key | Action |
|-----------|-----|--------|
| Button | Enter, Space | Activate |
| Link | Enter | Activate |
| Tab list | Arrow keys | Move between tabs |
| Menu | Arrow keys, Escape | Navigate, close |
| Modal | Escape | Close |
| Listbox | Arrow keys, Home, End | Navigate items |
| Combobox | Arrow keys, Enter, Escape | Navigate, select, close |

### Verification

1. Disconnect mouse/trackpad
2. Navigate entire application using only keyboard
3. Verify every interactive element is reachable and operable
4. Verify focus is always visible
5. Document any traps or inaccessible elements

---

## 3. Screen Reader Compatibility

### Requirements

- [ ] All images have appropriate `alt` text
- [ ] Form inputs have associated `<label>` elements
- [ ] Headings follow hierarchical order (h1 > h2 > h3, no skipping)
- [ ] Landmark regions used (header, nav, main, footer)
- [ ] Custom components have correct ARIA roles
- [ ] Dynamic content updates announced via ARIA live regions
- [ ] Tables have `<caption>` or `aria-label`
- [ ] Lists use proper `<ul>`, `<ol>`, `<dl>` markup

### ARIA rules

1. **Don't use ARIA if native HTML works.** A `<button>` is always better than `<div role="button">`.
2. **Don't change native semantics.** Don't put `role="button"` on an `<a>`.
3. **All interactive ARIA controls must be keyboard accessible.**
4. **Don't use `role="presentation"` or `aria-hidden="true"` on focusable elements.**
5. **All interactive elements must have an accessible name.**

### Testing tools

- **axe-core** — Automated scan (catches ~30% of issues)
- **NVDA** (Windows) / **VoiceOver** (Mac) — Manual screen reader testing
- **Lighthouse** — Accessibility audit in Chrome DevTools

### Verification

1. Run `axe-core` or equivalent automated scan
2. Test critical flows with a screen reader (NVDA or VoiceOver)
3. Verify all dynamic content is announced
4. Verify all form errors are communicated
5. Document findings with specific element references

---

## 4. Visual Contrast Requirements

### Minimum ratios

| Element | Minimum Ratio | Standard |
|---------|--------------|----------|
| Normal text (< 18pt or < 14pt bold) | 4.5:1 | WCAG AA |
| Large text (>= 18pt or >= 14pt bold) | 3:1 | WCAG AA |
| UI components & graphical objects | 3:1 | WCAG AA |
| Focus indicators | 3:1 | WCAG AA |

### Testing process

1. Use a contrast checker (WebAIM, browser DevTools, or axe)
2. Test all text colors against their background
3. Test all states: default, hover, focus, active, disabled, error
4. Test in both light and dark themes (if applicable)
5. Test at 200% browser zoom

### Common failures

- Gray text on white background (often fails 4.5:1)
- Placeholder text in inputs (often too low contrast)
- Disabled elements (no contrast requirement, but don't mislead)
- Icons and graphical elements without sufficient contrast
- Focus indicators that don't meet 3:1 against adjacent colors

---

## 5. ARIA Live Regions

Use live regions when content updates dynamically without a page reload.

### When to use

| Scenario | `aria-live` value | Example |
|----------|-------------------|---------|
| Status messages | `polite` | "3 results found", "Form saved" |
| Error messages | `assertive` | "Email address is invalid" |
| Progress updates | `polite` | "Uploading... 60%" |
| Timer/countdown | `assertive` | "Session expires in 30 seconds" |

### Implementation

```html
<!-- Polite: announced after current speech finishes -->
<div aria-live="polite" aria-atomic="true">
  <!-- Update this content dynamically -->
</div>

<!-- Assertive: interrupts current speech -->
<div aria-live="assertive" role="alert">
  <!-- Error messages -->
</div>
```

### Rules

1. Live regions must be in the DOM before content updates (don't create and update simultaneously)
2. `aria-atomic="true"` announces the entire region; `false` announces only the changed part
3. Don't overuse `assertive` — it interrupts the user
4. Prefer `polite` for non-critical updates
5. Use `role="status"` as shorthand for `aria-live="polite"` on status messages
6. Use `role="alert"` as shorthand for `aria-live="assertive"` on alerts

### Verification

1. Enable a screen reader
2. Trigger dynamic content updates
3. Verify announcements are made at the right time and with the right priority
4. Verify announcements contain meaningful content (not empty or ambiguous)

---

## 6. Focus Management

### Requirements

- [ ] Focus moves to new content when it appears (modals, notifications)
- [ ] Focus returns to trigger element when ephemeral content closes
- [ ] Focus is trapped within modals (Tab cycles within the modal)
- [ ] Focus is restored to logical position after async operations
- [ ] Skip navigation link moves focus to main content
- [ ] No focus is lost after DOM mutations

### Modal focus trap pattern

```typescript
function trapFocus(modal: HTMLElement) {
  const focusable = modal.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0] as HTMLElement;
  const last = focusable[focusable.length - 1] as HTMLElement;

  modal.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}
```

### Focus management for dynamic content

| Action | Focus should move to |
|--------|---------------------|
| Modal opens | First focusable element in modal (or modal itself) |
| Modal closes | Element that triggered the modal |
| Toast/notification appears | Not automatically (use `aria-live` instead) |
| New content loads | First heading or meaningful element in new content |
| Form submission fails | First invalid field or error summary |
| Tab panel changes | New tab panel or its heading |

### Verification

1. Open/close every modal; verify focus moves correctly
2. Navigate with keyboard only through all dynamic content
3. After async operations, verify focus is on a meaningful element
4. Use browser DevTools to track `document.activeElement`
5. Test with screen reader to verify context is announced

---

## Application Rules

1. **Design seat** owns this checklist at every Boardroom checkpoint for UI tasks.
2. WCAG 2.1 AA compliance is **mandatory** — no overrides without documented accessibility impact assessment.
3. Automated scans catch ~30% of issues; manual testing with assistive technology is required.
4. New components must pass all checklist items before ship-readiness.
5. This document is versioned. Changes require a Boardroom checkpoint with the Design seat.
