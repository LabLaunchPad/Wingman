// Pure checks for the WKOS document contract. Imported by validate-wkos.mjs, which supplies
// the real filesystem, and by tests, which supply a fake one.
//
// The rule these enforce is the one thing that decides whether WKOS is a knowledge system or
// dead weight: every document has a real producer and a real consumer, or it is a template.
//
// That is not a style preference. A pasted ~60-file org-governance blueprint was cut down to
// 10 files in 2026-07-22 after an audit found "the blueprint's files have zero consumer... dead
// weight on creation" (docs/PROJECT.md), violating skills/evidence-gated-catalog's
// no-speculative-bulk-creation rule. WKOS is ~130 documents and is the same shape, so the rule
// gets a mechanical check rather than a promise.
//
// Split from the I/O for the same reason constitution-check.mjs is: a validator that runs its
// whole pass at import time cannot be tested without executing it as a side effect.

const VALID_STATUSES = new Set(['produced', 'existing', 'template']);

// A producer-map row: | `DOC.md` | `status` | producer text |
const ROW = /^\|\s*`([^`]+)`\s*\|\s*`([a-z]+)`\s*\|\s*(.*?)\s*\|\s*$/;

// Plugin-relative paths cited as producers. Bare .wingman/ and LEARNINGS.md paths are runtime
// artifacts rather than plugin files, so they are named but not resolved here.
//
// Deliberately does NOT require a closing backtick straight after the path: a producer is often
// cited with the flag that produces the document (`scripts/check-traceability.mjs --chain`), and
// an earlier version anchored on the closing backtick, silently failing to match every such row
// and reporting it as having no producer at all. Caught on this checker's first real run.
const PLUGIN_PATH = /`((?:skills|hooks|scripts|references|commands|agents)\/[A-Za-z0-9_./-]+)/g;

/**
 * Parse producer-map.md into rows. Ignores prose and non-table lines.
 * @returns {{doc: string, status: string, producer: string}[]}
 */
export function parseProducerMap(text) {
  const rows = [];
  for (const line of text.split('\n')) {
    const m = line.match(ROW);
    if (m) rows.push({ doc: m[1], status: m[2], producer: m[3] });
  }
  return rows;
}

/**
 * The core rule. Every row must carry a valid status; `produced`/`existing` rows must name at
 * least one real plugin path, and every path they name must exist; `template` rows must not
 * claim a producer, since claiming one is how a gap silently stops looking like a gap.
 *
 * @param {string} producerMapText  contents of references/wkos/producer-map.md
 * @param {(relPath: string) => boolean} exists  resolves a plugin-relative path
 */
export function checkProducerMap(producerMapText, exists) {
  const problems = [];
  const rows = parseProducerMap(producerMapText);

  if (rows.length === 0) {
    problems.push('wkos: producer-map.md contains no document rows — the map is what makes the contract checkable');
    return problems;
  }

  const seen = new Set();
  for (const { doc, status, producer } of rows) {
    if (!VALID_STATUSES.has(status)) {
      problems.push(`wkos: "${doc}" has status "${status}" — must be one of ${[...VALID_STATUSES].join('/')}`);
      continue;
    }

    // A document listed twice with different producers is a drift bug in waiting.
    const key = `${doc}`;
    if (seen.has(key)) {
      problems.push(`wkos: "${doc}" appears more than once in the producer map`);
    }
    seen.add(key);

    const cited = [...producer.matchAll(PLUGIN_PATH)].map((m) => m[1]);

    if (status === 'template') {
      if (cited.length > 0) {
        problems.push(
          `wkos: "${doc}" is marked template but names producer "${cited[0]}" — a template is a gap, ` +
          `and claiming a producer is how a gap stops looking like one`,
        );
      }
      continue;
    }

    // produced | existing
    if (cited.length === 0) {
      problems.push(
        `wkos: "${doc}" is marked "${status}" but names no plugin file that produces it — ` +
        `mark it "template" instead, or name what actually writes it`,
      );
      continue;
    }
    for (const path of cited) {
      if (!exists(path)) {
        problems.push(`wkos: "${doc}" names producer "${path}", but that path does not exist in the plugin`);
      }
    }
  }
  return problems;
}

/** Summary counts, for the validator's own output. */
export function summarize(producerMapText) {
  const rows = parseProducerMap(producerMapText);
  const by = { produced: 0, existing: 0, template: 0 };
  for (const r of rows) if (r.status in by) by[r.status] += 1;
  return { total: rows.length, ...by };
}
