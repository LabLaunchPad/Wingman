// The single source of truth for Wingman's 12 traceability ID prefixes, shared by every
// enforcer so they cannot drift apart again.
//
// Why this file exists: before it, `check-traceability.mjs` and `dod-structural-gate.mjs`
// each carried their own hand-written copy of this list. The 14-stage pipeline expansion
// (v20) added 7 prefixes to the former and nobody updated the latter, so for months the
// plan-mode gate silently ignored RS-, PJ-, JM-, IA-, WF-, VS- and PT- entirely — it was
// enforcing traceability on 5 of 12 stages while reporting success. Two copies of a list
// that must agree is a drift bug waiting to happen; one exported constant is not.
//
// Order matters for nothing here, but it mirrors the real pipeline sequence
// (discovery -> ... -> implementation-planning) so a reader can see the chain.
// See plugins/wingman/skills/traceability-linking/SKILL.md for what each prefix owns.

export const TRACEABILITY_PREFIXES = [
  'DISC', // discovery            -- the chain root; nothing precedes it
  'RS',   // research-synthesis
  'PJ',   // personas-jobs
  'JM',   // journey-mapping
  'DEF',  // define
  'IA',   // information-architecture
  'UX',   // uxflow
  'WF',   // wireframes
  'VS',   // visual-design-system
  'PT',   // prototype-usability
  'ARCH', // architecture
  'IP',   // implementation-planning -- the terminal prefix; nothing references it
];

// The prefix every chain must ultimately reach to count as traced to the vision.
export const ROOT_PREFIX = 'DISC';

// The terminal prefix. IDs with this prefix are expected to have no downstream
// reference, so they are exempt from the "unlinked requirement" warning.
export const TERMINAL_PREFIX = 'IP';

const alternation = TRACEABILITY_PREFIXES.join('|');

/** Matches a bare ID anywhere, e.g. `DEF-001`. */
export const ID_PATTERN = new RegExp(`\\b(${alternation})-\\d+\\b`);

/** Matches a markdown table row whose FIRST cell is an ID — how an ID is minted. */
export const TABLE_ROW_PATTERN = new RegExp(`^\\s*\\|\\s*(${alternation})-\\d+\\s*\\|`);

/**
 * Matches one `wingman:req` token followed by one or more space-separated IDs on the same
 * line. The `(?:\s+...)+` repetition is load-bearing: a single-ID version silently dropped
 * every ID after the first when a task genuinely satisfied more than one requirement, with
 * no warning that anything had been missed (found via real dogfooding — see
 * docs/history/retros.md, 2026-07-15).
 *
 * Callers that use `.exec()` in a loop must reset `.lastIndex` first, since this carries
 * the `g` flag and is module-scoped.
 */
export const MARKER_PATTERN = new RegExp(`wingman:req((?:\\s+(?:${alternation})-\\d+)+)`, 'g');

/** `DEF-001` -> `DEF`. Returns null for anything that isn't a well-formed ID. */
export function prefixOf(id) {
  const m = String(id).match(new RegExp(`^(${alternation})-\\d+$`));
  return m ? m[1] : null;
}
