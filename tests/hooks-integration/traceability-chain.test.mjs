// Regression tests for the vision->code traceability chain, covering two real bugs found
// 2026-07-29 and the shared-constant fix that prevents both from recurring:
//
//   1. hooks/dod-structural-gate.mjs carried its own hand-written prefix list covering only
//      DISC|DEF|ARCH|UX|IP -- 5 of the 12 the 14-stage pipeline actually defines. Every RS-,
//      PJ-, JM-, IA-, WF-, VS- and PT- ID was invisible to the plan-mode gate, which reported
//      success while enforcing nothing for those 7 stages.
//   2. That same copy matched only ONE ID per wingman:req token, so a task satisfying several
//      requirements had every ID after the first silently dropped -- a bug
//      check-traceability.mjs had already found and fixed, still live in the duplicate.
//
// Both are now impossible to reintroduce independently: the patterns come from
// scripts/traceability-prefixes.mjs, and these tests assert against that single source.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { checkPlanningMilestoneTraceability } from '../../plugins/wingman/hooks/dod-structural-gate.mjs';
import {
  TRACEABILITY_PREFIXES,
  MARKER_PATTERN,
  TABLE_ROW_PATTERN,
  prefixOf,
  ROOT_PREFIX,
  TERMINAL_PREFIX,
} from '../../plugins/wingman/scripts/traceability-prefixes.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CHECKER = join(repoRoot, 'plugins', 'wingman', 'scripts', 'check-traceability.mjs');

// The gate only engages on a real Wingman implementation-planning plan.
const PLAN_HEADER = '# Plan\n## Implementation Planning checkpoint\n';

// Assembled at runtime so the literal marker token never appears in this file's own source.
// check-traceability.mjs scans the whole repo and cannot tell a real marker from one quoted
// as test data, so a literal here would register as a genuine orphaned marker and fail CI.
// The existing `evals` entry in the checker's SKIP_DIRS solves the same problem by skipping
// that directory outright; `tests/` deliberately is NOT skipped, because SKIP_DIRS ships with
// the plugin and would then blind the checker to a founder's own tests/ directory.
const REQ = `wingman:${'req'}`;

function runChecker(dir, ...args) {
  try {
    const stdout = execFileSync('node', [CHECKER, dir, ...args], { encoding: 'utf-8' });
    return { code: 0, stdout };
  } catch (err) {
    return { code: err.status, stdout: (err.stdout || '') + (err.stderr || '') };
  }
}

/** Build a throwaway founder-shaped project. `files` maps relative path -> contents. */
function makeProject(files) {
  const dir = mkdtempSync(join(tmpdir(), 'wingman-chain-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

// --- The shared constant itself -------------------------------------------------------

test('all 12 pipeline prefixes are defined in one place', () => {
  assert.deepEqual(TRACEABILITY_PREFIXES, [
    'DISC', 'RS', 'PJ', 'JM', 'DEF', 'IA', 'UX', 'WF', 'VS', 'PT', 'ARCH', 'IP',
  ]);
  assert.equal(ROOT_PREFIX, 'DISC', 'the chain root must be the discovery stage');
  assert.equal(TERMINAL_PREFIX, 'IP', 'the terminal prefix must be implementation-planning');
});

test('prefixOf resolves real IDs and rejects malformed ones', () => {
  assert.equal(prefixOf('DEF-001'), 'DEF');
  assert.equal(prefixOf('ARCH-42'), 'ARCH');
  assert.equal(prefixOf('NOPE-001'), null);
  assert.equal(prefixOf('DEF-'), null);
});

test('MARKER_PATTERN captures every ID after a single wingman:req token', () => {
  MARKER_PATTERN.lastIndex = 0;
  const [m] = [...`<!-- ${REQ} DEF-001 ARCH-002 WF-003 -->`.matchAll(MARKER_PATTERN)];
  assert.deepEqual(m[1].trim().split(/\s+/), ['DEF-001', 'ARCH-002', 'WF-003']);
});

test('TABLE_ROW_PATTERN mints from the first cell only, for every prefix', () => {
  for (const p of TRACEABILITY_PREFIXES) {
    assert.ok(TABLE_ROW_PATTERN.test(`| ${p}-001 | something | DISC-001 |`), `${p} should mint`);
  }
  // An ID in a later cell is an upstream edge, never a mint.
  assert.ok(!TABLE_ROW_PATTERN.test('| some prose | DEF-001 |'));
});

// --- Bug 1: the plan gate was blind to 7 of 12 prefixes -------------------------------

test('plan gate catches an orphan for every one of the 12 prefixes', () => {
  for (const p of TRACEABILITY_PREFIXES) {
    const res = checkPlanningMilestoneTraceability(`${PLAN_HEADER}<!-- ${REQ} ${p}-404 -->`);
    assert.equal(res.ok, false, `${p}-404 orphan must be caught`);
    assert.match(res.reason, new RegExp(`${p}-404`));
  }
});

test('plan gate accepts a minted ID for every one of the 12 prefixes', () => {
  for (const p of TRACEABILITY_PREFIXES) {
    const plan = `${PLAN_HEADER}| ${p}-001 | a row | DISC-001 |\n<!-- ${REQ} ${p}-001 -->`;
    assert.equal(checkPlanningMilestoneTraceability(plan).ok, true, `${p}-001 should pass`);
  }
});

// --- Bug 2: only the first ID per marker was checked ----------------------------------

test('plan gate checks every ID in a multi-ID marker, not just the first', () => {
  const plan = `${PLAN_HEADER}| DEF-001 | a row | DISC-001 |\n<!-- ${REQ} DEF-001 ARCH-999 -->`;
  const res = checkPlanningMilestoneTraceability(plan);
  assert.equal(res.ok, false, 'the second, unminted ID must not be silently dropped');
  assert.match(res.reason, /ARCH-999/);
});

test('plan gate leaves a non-Wingman plan completely alone', () => {
  assert.equal(checkPlanningMilestoneTraceability('# Unrelated plan').ok, true);
  assert.equal(checkPlanningMilestoneTraceability('').ok, true);
  assert.equal(checkPlanningMilestoneTraceability(null).ok, true);
});

// --- The chain itself: check-traceability.mjs -----------------------------------------

const CHAINED_PROJECT = {
  'docs/wingman/discovery/app.md':
    '| ID | Finding | Evidence | Satisfies |\n|---|---|---|---|\n| DISC-001 | the problem | known | — |\n',
  'docs/wingman/define/app.md':
    '| ID | Requirement | Rationale | Satisfies |\n|---|---|---|---|\n| DEF-001 | the requirement | because | DISC-001 |\n',
  'docs/wingman/architecture/app.md':
    '| ID | Decision | Satisfies | Reuse |\n|---|---|---|---|\n| ARCH-001 | the decision | DEF-001 | none |\n',
  'docs/wingman/plans/2026-07-29-x.md':
    '| ID | Task | Satisfies |\n|---|---|---|\n| IP-001 | the task | DEF-001 ARCH-001 |\n',
  'src/app.js': `// ${REQ} IP-001\nexport const x = 1;\n`,
};

test('a fully chained project passes and traces code back to the vision', () => {
  const dir = makeProject(CHAINED_PROJECT);
  try {
    assert.equal(runChecker(dir).code, 0, 'a complete chain must PASS');

    const chain = runChecker(dir, '--chain', 'IP-001');
    assert.equal(chain.code, 0);
    assert.match(chain.stdout, /TRACED/);
    // Both routes to the root must be reported, not just the shortest.
    assert.match(chain.stdout, /IP-001\s+->\s+DEF-001\s+->\s+DISC-001/);
    assert.match(chain.stdout, /IP-001\s+->\s+ARCH-001\s+->\s+DEF-001\s+->\s+DISC-001/);

    assert.equal(runChecker(dir, '--orphans').code, 0, 'no chain breaks expected');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('breaking one Satisfies link breaks the whole chain to the vision', () => {
  const broken = { ...CHAINED_PROJECT };
  // Sever DEF-001 -> DISC-001, the single link nearest the vision.
  broken['docs/wingman/define/app.md'] =
    '| ID | Requirement | Rationale | Satisfies |\n|---|---|---|---|\n| DEF-001 | the requirement | because | |\n';
  const dir = makeProject(broken);
  try {
    const chain = runChecker(dir, '--chain', 'IP-001');
    assert.equal(chain.code, 1, 'a severed chain must exit non-zero');
    assert.match(chain.stdout, /BROKEN/);
    assert.match(chain.stdout, /does not trace back to the vision/);

    const orphans = runChecker(dir, '--orphans');
    assert.equal(orphans.code, 1);
    // Everything downstream of the severed link is now unrooted, not just DEF-001.
    for (const id of ['DEF-001', 'ARCH-001', 'IP-001']) {
      assert.match(orphans.stdout, new RegExp(`unrooted: "${id}"`));
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a code marker citing an unminted ID is a hard error', () => {
  // This is the exact founder-path failure the Discovery fix addresses: before Discovery
  // minted DISC-* IDs, build-stage code carrying `wingman:req DISC-001` orphaned every time.
  const dir = makeProject({ 'src/app.js': `// ${REQ} DISC-001\nexport const x = 1;\n` });
  try {
    const res = runChecker(dir);
    assert.equal(res.code, 1);
    assert.match(res.stdout, /orphaned marker: "DISC-001"/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('an ID reachable only through a later stage no longer warns as unlinked', () => {
  // The documented false positive: DEF-001 has no wingman:req marker anywhere, but ARCH-001's
  // Satisfies column names it. That row IS the downstream link.
  const dir = makeProject({
    'docs/wingman/discovery/app.md': '| DISC-001 | the problem | known | — |\n',
    'docs/wingman/define/app.md': '| DEF-001 | the requirement | because | DISC-001 |\n',
    'docs/wingman/architecture/app.md': '| ARCH-001 | the decision | DEF-001 | none |\n',
  });
  try {
    const res = runChecker(dir);
    assert.equal(res.code, 0);
    assert.doesNotMatch(res.stdout, /unlinked requirement: "DEF-001"/);
    assert.doesNotMatch(res.stdout, /unlinked requirement: "DISC-001"/);
    // ARCH-001 is genuinely the chain tip here, so it legitimately still warns.
    assert.match(res.stdout, /unlinked requirement: "ARCH-001"/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('IP-* is exempt from the unlinked warning as the terminal prefix', () => {
  const dir = makeProject({
    'docs/wingman/discovery/app.md': '| DISC-001 | the problem | known | — |\n',
    'docs/wingman/plans/p.md': '| IP-001 | the task | DISC-001 |\n',
  });
  try {
    const res = runChecker(dir);
    assert.equal(res.code, 0);
    assert.doesNotMatch(res.stdout, /unlinked requirement: "IP-001"/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a Satisfies cycle terminates instead of recursing forever', () => {
  // Defensive: a malformed project should report a break, never hang the checker.
  const dir = makeProject({
    'docs/wingman/define/app.md': '| DEF-001 | a | b | ARCH-001 |\n',
    'docs/wingman/architecture/app.md': '| ARCH-001 | a | DEF-001 | b |\n',
  });
  try {
    const res = runChecker(dir, '--chain', 'DEF-001');
    assert.equal(res.code, 1, 'a cycle reaches no root, so it is BROKEN');
    assert.match(res.stdout, /cycle/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('--chain on a never-minted ID reports it rather than claiming a clean walk', () => {
  const dir = makeProject({ 'docs/wingman/discovery/app.md': '| DISC-001 | p | known | — |\n' });
  try {
    const res = runChecker(dir, '--chain', 'DEF-999');
    assert.equal(res.code, 1);
    assert.match(res.stdout, /NOT MINTED/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('an empty project reports nothing to check rather than failing', () => {
  const dir = makeProject({ 'README.md': '# nothing traceable here\n' });
  try {
    const res = runChecker(dir);
    assert.equal(res.code, 0, 'a non-Wingman project must never be blocked');
    assert.match(res.stdout, /PASS/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
