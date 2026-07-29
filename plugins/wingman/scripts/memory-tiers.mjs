// The 7-tier Memory Engine: Global and Org live outside any repo (~/.wingman/), Product,
// Project, Feature, Task, and User live inside the founder's project (.wingman/memory/...).
//
// Pure path/precedence/write-guard logic. Imported by scripts/query-founder-knowledge.mjs (which
// composes it with okf-export.mjs's existing readMemoryFile parser -- no new parsing logic here,
// per references/constitution.md rule 3, reuse before reinvent) and by hooks/session-start.mjs.
//
// Design notes, not silently assumed:
//
// - Product and Project are the SAME store in this version. Wingman has no multi-product-per-
//   founder-project concept anywhere in its real architecture -- one project genuinely is one
//   product for a solo founder. Two tiers with no distinguishing signal between them would be the
//   exact invented-structure pattern references/constitution.md rule 3 forbids. Documented here,
//   not silently dropped: PRODUCT and PROJECT resolve to the identical path.
// - Global/Org are the two tiers that live OUTSIDE any repo. This is compatible with
//   docs/status/ARCHITECTURE.md §2's "no persistent runtime" rule, which explicitly permits
//   file-backed state opened on demand -- it forbids an always-on daemon, not a file on disk.
// - Narrower tier wins on precedence, but nothing here silently discards a wider-tier entry: see
//   readAllTiers below, which returns every tier's entries, ordered narrowest-first, and leaves
//   contradiction-noticing to the reading agent/skill rather than an automatic text-diff (a
//   freeform-prose contradiction detector would be the kind of complexity
//   references/constitution.md rule 4 warns against for a problem a human/agent reader already
//   solves better).
// - Promotion between tiers (lifting a project fact to Org/Global) is never automatic. This is
//   enforced here, not just documented: writeTierEntry() to a global/org tier throws unless
//   called with { approved: true } -- the caller must have actually gotten founder approval via
//   AskUserQuestion first, per the skill's own escalation rule.

import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { SECRET } from '../hooks/secret-guard.mjs';

export const TIERS = ['global', 'org', 'product', 'project', 'feature', 'task', 'user'];

// Tiers whose promotion requires explicit founder approval before a write is allowed -- they
// live outside the repo, so they are invisible to code review and have the widest blast radius.
export const APPROVAL_REQUIRED_TIERS = new Set(['global', 'org']);

const STORE_FILES = ['MEMORY.md', 'decisions.md', 'tried.md'];

/**
 * Resolve the directory a given tier's memory files live in.
 *
 * @param {string} tier one of TIERS
 * @param {string} projectDir the founder's project root (for in-repo tiers)
 * @param {object} [opts]
 * @param {string} [opts.org] org slug, required for the 'org' tier
 * @param {string} [opts.feature] feature slug, required for the 'feature' tier
 * @param {string} [opts.task] task id, required for the 'task' tier
 * @param {string} [opts.user] user identifier, required for the 'user' tier
 * @param {string} [opts.homeDir] override for os.homedir(), test seam only
 */
export function tierDir(tier, projectDir, opts = {}) {
  const home = opts.homeDir ?? homedir();
  switch (tier) {
    case 'global':
      return join(home, '.wingman', 'global');
    case 'org':
      if (!opts.org) throw new Error('memory-tiers: the "org" tier requires opts.org (an org slug)');
      return join(home, '.wingman', 'org', opts.org);
    case 'product':
    case 'project':
      // Same store, deliberately -- see the module header note.
      return join(projectDir, '.wingman', 'memory');
    case 'feature':
      if (!opts.feature) throw new Error('memory-tiers: the "feature" tier requires opts.feature (a feature slug)');
      return join(projectDir, '.wingman', 'memory', 'feature', opts.feature);
    case 'task':
      if (!opts.task) throw new Error('memory-tiers: the "task" tier requires opts.task (a task id)');
      return join(projectDir, '.wingman', 'memory', 'task', String(opts.task));
    case 'user':
      if (!opts.user) throw new Error('memory-tiers: the "user" tier requires opts.user (a user identifier)');
      return join(projectDir, '.wingman', 'memory', 'user', opts.user);
    default:
      throw new Error(`memory-tiers: unknown tier "${tier}" -- must be one of ${TIERS.join(', ')}`);
  }
}

function readStoreFile(dir, filename) {
  const p = join(dir, filename);
  if (!existsSync(p)) return { exists: false, content: '' };
  const content = readFileSync(p, 'utf-8').trim();
  return { exists: content.length > 0, content };
}

/**
 * Read every store file (MEMORY/decisions/tried) for one tier. Returns entries in the same
 * bullet-line shape query-founder-knowledge.mjs's unify() already produces, tagged with `tier`.
 */
export function readTier(tier, projectDir, opts = {}) {
  const dir = tierDir(tier, projectDir, opts);
  const entries = [];
  for (const filename of STORE_FILES) {
    const { exists, content } = readStoreFile(dir, filename);
    if (!exists) continue;
    const source = filename === 'MEMORY.md' ? 'memory' : filename.replace('.md', '');
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim();
      if (!line.startsWith('-')) continue;
      const body = line.replace(/^-\s*/, '');
      const m = body.match(/^(\d{4}-\d{2}-\d{2}):\s*(.*)$/);
      entries.push({
        tier,
        source,
        date: m ? m[1] : null,
        text: m ? m[2] : body,
      });
    }
  }
  return entries;
}

/**
 * Read all 7 tiers, ordered narrowest-first (task, user, feature, product/project, org, global).
 * Nothing is merged or deduplicated -- a wider-tier entry that a narrower tier's fact contradicts
 * is returned alongside it, not discarded, so the reading agent can notice and surface the
 * conflict rather than one silently winning.
 *
 * Tiers requiring an identifier the caller didn't supply (feature/task/user without a slug, org
 * without a slug) are silently skipped -- most calls only have a project directory and want
 * project+global+org context, not every possible feature/task/user scope.
 */
export function readAllTiers(projectDir, opts = {}) {
  const order = ['task', 'user', 'feature', 'product', 'project', 'org', 'global'];
  const entries = [];
  for (const tier of order) {
    if (tier === 'feature' && !opts.feature) continue;
    if (tier === 'task' && !opts.task) continue;
    if (tier === 'user' && !opts.user) continue;
    if (tier === 'org' && !opts.org) continue;
    if (tier === 'product') continue; // identical store to 'project' -- reading both would double-count
    try {
      entries.push(...readTier(tier, projectDir, opts));
    } catch {
      // A tier whose identifier is missing (shouldn't happen given the guards above) is skipped,
      // never a hard failure -- reading memory must never block a session.
    }
  }
  return entries;
}

function containsSecret(text) {
  return SECRET.some((re) => re.test(text));
}

/**
 * Append one dated entry to a tier's store file. Enforces two things mechanically, not just by
 * convention:
 *   1. A secret-shaped string is rejected at every tier, reusing hooks/secret-guard.mjs's exact
 *      pattern set -- no separate copy to drift.
 *   2. Writing to an approval-required tier (global/org) throws unless the caller passes
 *      { approved: true }, which only a real founder AskUserQuestion approval should set.
 *
 * @param {string} tier
 * @param {string} projectDir
 * @param {'MEMORY'|'decisions'|'tried'} file which store file (without extension)
 * @param {string} text the entry body (no leading "- " or date -- added here)
 * @param {object} [opts] same as tierDir's opts, plus { approved, date }
 */
export function writeTierEntry(tier, projectDir, file, text, opts = {}) {
  if (containsSecret(text)) {
    throw new Error('memory-tiers: refusing to write a secret-shaped string to any memory tier');
  }
  if (APPROVAL_REQUIRED_TIERS.has(tier) && !opts.approved) {
    throw new Error(
      `memory-tiers: writing to the "${tier}" tier requires explicit founder approval -- ` +
      `pass { approved: true } only after a real AskUserQuestion confirmation, never by default`,
    );
  }
  const dir = tierDir(tier, projectDir, opts);
  mkdirSync(dir, { recursive: true });
  const filename = `${file}.md`;
  const date = opts.date ?? new Date().toISOString().slice(0, 10);
  const line = file === 'MEMORY' ? `- ${text}\n` : `- ${date}: ${text}\n`;
  appendFileSync(join(dir, filename), line);
}
