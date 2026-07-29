// Pure check: every rule in references/constitution.md must name enforcement that actually
// exists. Imported by validate-structure.mjs, which supplies the real filesystem.
//
// Why this lives in its own module rather than inside validate-structure.mjs: that script runs
// its whole validation pass at import time, so a test importing it would execute the entire
// validator as a side effect. Splitting the decision logic from the I/O is the same
// wiring/logic separation references/fablize-pattern.md documents, and the same shape
// traceability-prefixes.mjs already uses.
//
// Why the check is an ERROR and not a warning: a constitution rule pointing at a file that does
// not exist is a false claim about the system's own safety properties. That is worse than making
// no claim, because it reads as coverage. This project already declined a ~60-file governance
// tree whose files had "zero consumer" (docs/status/PROJECT.md, 2026-07-22) -- this check is what
// stops the constitution becoming that same dead weight.

// Only plugin-relative, backticked paths are checked. `docs/` citations are deliberately NOT
// accepted as enforcement anywhere in the constitution: docs/ does not ship with the plugin, so a
// founder's install cannot reach it and it can never be a runtime dependency (see
// plugins/wingman/AGENTS.md). Such a citation is caught by checkNoUnshippedEnforcement below.
const ENFORCED_BY_BLOCK = /\*\*Enforced by:\*\*([\s\S]*?)(?:\n\n|$)/g;
const PLUGIN_PATH = /`((?:skills|hooks|scripts|references|commands)\/[A-Za-z0-9_./-]+)`/g;
const UNSHIPPED_PATH = /`(docs\/[A-Za-z0-9_./-]+)`/g;

/**
 * @param {string} constitutionText  contents of references/constitution.md
 * @param {(relPath: string) => boolean} exists  resolves a plugin-relative path
 * @returns {string[]} problems, empty when the constitution is sound
 */
export function checkConstitutionCitations(constitutionText, exists) {
  const problems = [];
  const blocks = [...constitutionText.matchAll(ENFORCED_BY_BLOCK)];

  if (blocks.length === 0) {
    problems.push('constitution: no "**Enforced by:**" lines found — every rule must name real enforcement');
    return problems;
  }

  for (const block of blocks) {
    const claim = block[1];
    for (const m of claim.matchAll(PLUGIN_PATH)) {
      if (!exists(m[1])) {
        problems.push(
          `constitution: rule cites "${m[1]}" as enforcement, but that path does not exist in the plugin`,
        );
      }
    }
    for (const m of claim.matchAll(UNSHIPPED_PATH)) {
      problems.push(
        `constitution: rule cites "${m[1]}" as enforcement, but docs/ does not ship with the plugin — ` +
        `a founder's install cannot reach it, so it cannot enforce anything`,
      );
    }
  }
  return problems;
}
