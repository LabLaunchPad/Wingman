// Wingman Definition-of-Done gate, ported to an OpenCode plugin -- the `git push` half of the
// shipped Claude Code plugin's PreToolUse hook (plugins/wingman/hooks/dod-structural-gate.mjs).
// The ExitPlanMode/traceability half of that hook is deliberately NOT ported here: `plan_exit` is
// not a registered tool in OpenCode's real agent `tools` list (confirmed by wingman-gate.js's own
// live investigation in this same directory), so that half would be dead code in OpenCode exactly
// the way it already is there -- no point duplicating a confirmed-non-firing wiring path.
//
// Verification status (2026-07-25, real live investigation, not assumed): every pure decision
// function below (checkBoardroomVerdictClean, checkVerdictTranscriptionMatchesDetails,
// checkTestPresence, detectTestCommand, runTestSuite, checkThreatRegisterCleanAcrossArtifacts, and
// their shared file-reading helpers) is a byte-faithful port of the canonical hook's own exported
// functions -- same regexes, same .wingman/checkpoints.jsonl parsing, same threat-register table
// parsing. The WIRING -- `tool.execute.before` matched on `input.tool === 'bash'` and a `git push`
// command -- is CONFIRMED WORKING via a real live test using a genuinely free OpenCode model
// (`opencode/deepseek-v4-flash-free`, zero cost, zero API key), the same technique secret-guard.js's
// header documents and this port re-ran independently:
//
// 1. A throwaway fixture project was built under /tmp with a `.wingman/checkpoints.jsonl`
//    containing a Build-stage checkpoint whose `bottom_line` was "DO NOT SHIP".
// 2. `opencode run -m opencode/deepseek-v4-flash-free "git push origin main"` was run with this
//    plugin file copied into the fixture's own `.opencode/plugin/`. The push was genuinely BLOCKED
//    -- the model's own final response reported the tool error, and no `git push` process ever ran
//    (confirmed: no network activity, no remote update, error text visible in the transcript).
// 3. The same fixture with a clean checkpoint (bottom_line "GO", no NO_GO seats, matching
//    transcription, a passing test suite, and a threat register with only CLOSED rows) was NOT
//    blocked by this gate.
//
// See tests/opencode-gate/opencode-dod-gate.test.mjs for in-process unit coverage of the pure
// decision functions, independent of the live OpenCode session test above.
//
// Deliberately NOT ported: the canonical hook's traceability delegation step (calling
// plugins/wingman/scripts/check-traceability.mjs via execFileSync('node', [traceScript, cwd])).
// That script only ships inside plugins/wingman/ itself; a project driven through this OpenCode
// adapter has no guarantee that path exists relative to wherever OpenCode itself is invoked from,
// so faithfully porting it would mean either bundling a copy (drift risk against the real script)
// or silently no-op'ing when the path is missing (a false sense of coverage). The checks that ARE
// ported here (Boardroom verdict, verdict-transcription integrity, test presence, test suite
// passing, threat register) are all self-contained against files already inside the project being
// gated, so they port cleanly with no such external dependency.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const NO_TEST_NEEDED = /<!--\s*wingman:no-test-needed:.*?-->/i;
const TEST_FILE_HINT = /\.(test|spec)\.|_test\.|test_/;

// --- checkpoint lookup ---

export function findLatestBuildCheckpoint(cwd) {
  const file = join(cwd, '.wingman', 'checkpoints.jsonl');
  if (!existsSync(file)) return null;
  let lines;
  try { lines = readFileSync(file, 'utf-8').split('\n').filter(Boolean); } catch { return null; }
  for (let i = lines.length - 1; i >= 0; i--) {
    let entry;
    try { entry = JSON.parse(lines[i]); } catch { continue; }
    const stage = entry.stage;
    const isBuild = entry.bundle === 'build' || stage === 'build' ||
      (Array.isArray(stage) && stage.includes('build'));
    if (isBuild) return entry;
  }
  return null;
}

// A checkpoint entry existing is not the same as it having actually passed -- the Boardroom's own
// consolidation rule is "any NO_GO anywhere overrides any approval elsewhere", so check both the
// top-level bottom_line AND every individual seat's verdict as defense-in-depth, in case
// consolidation didn't propagate a seat-level NO_GO up into bottom_line correctly. Byte-faithful
// port of the canonical hook's own checkBoardroomVerdictClean.
export function checkBoardroomVerdictClean(checkpoint) {
  if (!checkpoint) return { ok: true };
  if (String(checkpoint.bottom_line || '').trim().toUpperCase() === 'DO NOT SHIP') {
    return { ok: false, reason: `its recorded bottom line was "DO NOT SHIP"` };
  }
  const noGoSeat = (checkpoint.seats || []).find((s) => String(s.verdict || '').toUpperCase() === 'NO_GO');
  if (noGoSeat) {
    return { ok: false, reason: `its "${noGoSeat.seat}" seat recorded a NO_GO verdict` };
  }
  return { ok: true };
}

// A checkpoint recording "clean" is not the same as that recording being an accurate transcription
// of what each seat actually said. Mechanical regex extraction against the `details_ref` companion
// file, never a semantic judgment call. Entries with no `details_ref` (or a failed detail write)
// have nothing to cross-check against and are skipped, not failed. Byte-faithful port of the
// canonical hook's own checkVerdictTranscriptionMatchesDetails.
const SEAT_VERDICT_LINE = /^##\s*([A-Z][A-Z\s]*?)\s+VERDICT:\s*(GO_WITH_CONCERNS|NO_GO|GO)\b/gim;

export function checkVerdictTranscriptionMatchesDetails(checkpoint, cwd) {
  if (!checkpoint || !checkpoint.details_ref) return { ok: true };
  let detailsText;
  try {
    detailsText = readFileSync(join(cwd, checkpoint.details_ref), 'utf-8');
  } catch {
    return { ok: true }; // details_ref points at a file that doesn't exist -- nothing to cross-check
  }
  const rawVerdicts = new Map();
  for (const m of detailsText.matchAll(SEAT_VERDICT_LINE)) {
    rawVerdicts.set(m[1].trim().toUpperCase(), m[2].toUpperCase());
  }
  for (const s of checkpoint.seats || []) {
    const seatKey = String(s.seat || '').trim().toUpperCase();
    const rawVerdict = rawVerdicts.get(seatKey);
    const recordedVerdict = String(s.verdict || '').toUpperCase();
    if (rawVerdict && rawVerdict !== recordedVerdict) {
      return {
        ok: false,
        reason: `its "${s.seat}" seat's raw verdict block says "${rawVerdict}" but checkpoints.jsonl ` +
          `recorded "${recordedVerdict}" -- a transcription mismatch, not just a low-detail summary`,
      };
    }
  }
  return { ok: true };
}

// --- plan/build artifact discovery (feeds the threat-register check) ---

export function findPlanFileFromCheckpoint(cwd) {
  const file = join(cwd, '.wingman', 'checkpoints.jsonl');
  if (!existsSync(file)) return null;
  let lines;
  try { lines = readFileSync(file, 'utf-8').split('\n').filter(Boolean); } catch { return null; }
  for (let i = lines.length - 1; i >= 0; i--) {
    let entry;
    try { entry = JSON.parse(lines[i]); } catch { continue; }
    const scopeRef = entry.scope_ref;
    if (typeof scopeRef === 'string' && scopeRef.endsWith('.md') && scopeRef !== 'diff') {
      const full = join(cwd, scopeRef);
      if (existsSync(full)) return full;
    }
  }
  return null;
}

function findMostRecentPlanFileByMtime(cwd) {
  const plansDir = join(cwd, 'docs', 'wingman', 'plans');
  try {
    const files = readdirSync(plansDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => join(plansDir, f));
    if (files.length === 0) return null;
    files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
    return files[0];
  } catch {
    return null;
  }
}

export function findMostRecentPlanFilePath(cwd) {
  return findPlanFileFromCheckpoint(cwd) || findMostRecentPlanFileByMtime(cwd);
}

function findMostRecentPlanFile(cwd) {
  const path = findMostRecentPlanFilePath(cwd);
  if (!path) return null;
  try { return readFileSync(path, 'utf-8'); } catch { return null; }
}

// build.md's convention is to append the threat register directly to the plan file, but a project
// can end up with it in a separate file under docs/wingman/build/ instead -- scan that directory
// (one level deep) too, as a defensive backstop, not the primary mechanism.
export function findAllBuildArtifactTexts(cwd) {
  const texts = [];
  const planText = findMostRecentPlanFile(cwd);
  if (planText) texts.push(planText);
  const buildDir = join(cwd, 'docs', 'wingman', 'build');
  try {
    for (const f of readdirSync(buildDir)) {
      if (!f.endsWith('.md')) continue;
      try { texts.push(readFileSync(join(buildDir, f), 'utf-8')); } catch { /* skip unreadable */ }
    }
  } catch { /* no build/ dir -- fine, plan file (if any) is all there is */ }
  return texts;
}

// --- test presence ---

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Optimized via the flat accumulator pattern. We pass `results` directly as an argument
// to recursive calls rather than creating intermediate arrays and concatenating them via `.concat()`.
// This avoids high memory allocation and garbage collection overhead during deep traversals.
function listFilesRecursive(dir, results = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return results; }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) listFilesRecursive(full, results);
    else results.push(full);
  }
  return results;
}

// Fallback for behavior-split test suites: a source file's tests may live across several
// behavior-named files rather than a single file matching the source's own basename. Scans
// test/tests/__tests__ directories for any test file whose content actually imports/requires the
// source module by name, before giving up on it.
function anyTestFileReferencesSource(baseName, testFiles) {
  const escaped = escapeRegExp(baseName);
  const importRef = new RegExp(
    `(?:from\\s+['"][^'"]*/${escaped}(?:\\.[a-zA-Z]+)?['"]` +
    `|require\\(\\s*['"][^'"]*/${escaped}(?:\\.[a-zA-Z]+)?['"]\\s*\\)` +
    `|^\\s*import\\s+${escaped}\\b` +
    `|from\\s+[\\w.]*${escaped}\\s+import)`,
    'm'
  );
  for (const { content } of testFiles) {
    if (importRef.test(content)) return true;
  }
  return false;
}

export function checkTestPresence(cwd, changedFiles) {
  const missing = [];

  let testFiles = null;
  function ensureTestFiles() {
    if (testFiles) return testFiles;
    testFiles = [];
    for (const dirName of ['test', 'tests', '__tests__']) {
      const dir = join(cwd, dirName);
      if (!existsSync(dir) || !statSync(dir).isDirectory()) continue;
      for (const file of listFilesRecursive(dir)) {
        if (!TEST_FILE_HINT.test(file)) continue;
        try { testFiles.push({ file, content: readFileSync(file, 'utf-8') }); } catch { /* skip unreadable */ }
      }
    }
    return testFiles;
  }

  for (const f of changedFiles) {
    if (TEST_FILE_HINT.test(f)) continue; // it's itself a test file
    if (!/\.(js|jsx|ts|tsx|mjs|py|rb|go|java|rs)$/.test(f)) continue; // not source
    let content = '';
    try { content = readFileSync(join(cwd, f), 'utf-8'); } catch { continue; }
    if (NO_TEST_NEEDED.test(content)) continue; // logged escape hatch
    const base = f.replace(/\.[^.]+$/, '');
    const baseName = f.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
    const ext = f.match(/\.([^./]+)$/)?.[1] || 'js';
    const candidates = [
      `${base}.test.js`, `${base}.test.ts`, `${base}.spec.js`, `${base}.spec.ts`,
      f.replace(/\/([^/]+)\.([^./]+)$/, '/__tests__/$1.test.$2'),
      f.replace(/\/([^/]+)\.([^./]+)$/, '/test_$1.$2'),
      `test/${baseName}.test.${ext}`, `test/${baseName}.spec.${ext}`, `test/test_${baseName}.${ext}`,
      `tests/${baseName}.test.${ext}`, `tests/${baseName}.spec.${ext}`, `tests/test_${baseName}.${ext}`,
    ];
    const hasTest = candidates.some((c) => existsSync(join(cwd, c)))
      || anyTestFileReferencesSource(baseName, ensureTestFiles());
    if (!hasTest) missing.push(f);
  }
  return missing;
}

// --- threat register ---

const THREAT_REGISTER_HEADING = /^##\s+.*Threat Register/im;

function extractThreatRegisterSection(text) {
  const match = THREAT_REGISTER_HEADING.exec(text);
  if (!match) return null;
  const rest = text.slice(match.index);
  const nextHeading = rest.slice(match[0].length).search(/^##\s/m);
  return nextHeading === -1 ? rest : rest.slice(0, match[0].length + nextHeading);
}

// Parses the Threat Register's own markdown table and flags any row whose Status column isn't
// exactly "CLOSED" -- rather than pattern-matching for the literal substring "OPEN", which is
// trivially bypassed by any other word ("PENDING", "ACCEPTED", or a plain typo). The Status column
// is located dynamically from the header row, not assumed to be a fixed index.
function findUnresolvedThreatRows(sectionText) {
  const unresolved = [];
  let statusColIdx = -1;
  let sawHeader = false;
  for (const rawLine of sectionText.split('\n')) {
    const line = rawLine.trim();
    if (!line.startsWith('|') || !line.endsWith('|')) continue;
    const cells = line.slice(1, -1).split('|').map((c) => c.trim());
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue; // markdown separator row
    if (!sawHeader) {
      const idx = cells.findIndex((c) => /^status$/i.test(c));
      if (idx === -1) continue; // not the header row (or not a recognizable table yet)
      statusColIdx = idx;
      sawHeader = true;
      continue;
    }
    const status = cells[statusColIdx];
    if (status !== undefined && !/^closed$/i.test(status)) {
      unresolved.push({ id: cells[0], status });
    }
  }
  return unresolved;
}

// Checks every build-artifact text found (plan file + anything under docs/wingman/build/), not
// just one -- an unresolved row in ANY of them fails the gate.
export function checkThreatRegisterCleanAcrossArtifacts(texts) {
  for (const text of texts) {
    const section = extractThreatRegisterSection(text);
    if (!section) continue;
    if (findUnresolvedThreatRows(section).length > 0) return { ok: false };
  }
  return { ok: true };
}

// --- test suite: detection + actual run ---

// Detect the project's own declared test command generically -- Wingman builds arbitrary founder
// projects, not just Node.js ones. Returns null if nothing recognizable is present, so the caller
// can skip the check rather than invent a false failure.
export function detectTestCommand(cwd) {
  if (existsSync(join(cwd, 'package.json'))) {
    try {
      const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf-8'));
      if (pkg.scripts && pkg.scripts.test && !/no test specified/i.test(pkg.scripts.test)) {
        return { command: 'npm', args: ['test', '--silent'] };
      }
    } catch { /* malformed package.json -- fall through to other conventions */ }
  }
  if (existsSync(join(cwd, 'pytest.ini')) || existsSync(join(cwd, 'pyproject.toml')) || existsSync(join(cwd, 'setup.py'))) {
    return { command: 'python3', args: ['-m', 'pytest', '-q'] };
  }
  if (existsSync(join(cwd, 'go.mod'))) {
    return { command: 'go', args: ['test', './...'] };
  }
  if (existsSync(join(cwd, 'Cargo.toml'))) {
    return { command: 'cargo', args: ['test'] };
  }
  if (existsSync(join(cwd, 'Gemfile'))) {
    return { command: 'bundle', args: ['exec', 'rake', 'test'] };
  }
  return null;
}

// Actually runs the detected test command and reports pass/fail -- closes the gap "a test file
// exists" alone leaves open. Deterministic and mechanical: checks the exit code the project's own
// test runner reports, never a semantic judgment of test quality.
export function runTestSuite(cwd, testCmd) {
  if (!testCmd) return { ok: true, skipped: true }; // no recognized runner -- not this check's concern
  try {
    execFileSync(testCmd.command, testCmd.args, {
      cwd,
      encoding: 'utf-8',
      timeout: 120_000, // a hung suite must not hang the gate indefinitely
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true };
  } catch (err) {
    const output = String(err.stdout || '') + String(err.stderr || '');
    return { ok: false, output: output.slice(-2000) }; // tail only -- keep the deny message readable
  }
}

export function getChangedFiles(cwd, baseRef) {
  const candidates = [baseRef];
  try {
    const rootCommit = execFileSync('git', ['rev-list', '--max-parents=0', 'HEAD'], { cwd, encoding: 'utf-8' }).trim().split('\n')[0];
    if (rootCommit) candidates.push(rootCommit);
  } catch { /* not a git repo, or no commits yet */ }
  candidates.push('4b825dc642cb6eb9a060e54bf8d69288fbee4904'); // git's canonical empty tree hash

  for (const ref of candidates) {
    try {
      const out = execFileSync('git', ['diff', '--name-only', `${ref}..HEAD`], { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      return out.split('\n').filter(Boolean);
    } catch { /* try next candidate */ }
  }
  return [];
}

// --- top-level gate: given a real bash command + cwd, returns { allow, reason? } ---

const GIT_PUSH = /\bgit\s+push\b/;

// Pure orchestration, exported separately from the plugin wiring below so it can be unit-tested
// without a live OpenCode session -- same discipline as secret-guard.js's own exported `decide()`.
export function evaluateGitPush(command, cwd) {
  if (!GIT_PUSH.test(String(command || ''))) return { allow: true };

  const checkpoint = findLatestBuildCheckpoint(cwd);
  if (!checkpoint) return { allow: true }; // no Build-stage checkpoint recorded -- not this gate's concern

  const verdictResult = checkBoardroomVerdictClean(checkpoint);
  if (!verdictResult.ok) {
    return {
      allow: false,
      reason: `Wingman dod-gate: the most recent Build-stage Boardroom checkpoint recorded a ` +
        `blocking verdict -- ${verdictResult.reason}. Do not push until this is resolved (fix the ` +
        `concern and get a clean re-check, or get explicit founder override recorded in a new ` +
        `checkpoint) -- a checkpoint existing is not the same as it having actually passed.`,
    };
  }

  const transcriptionResult = checkVerdictTranscriptionMatchesDetails(checkpoint, cwd);
  if (!transcriptionResult.ok) {
    return {
      allow: false,
      reason: `Wingman dod-gate: the most recent Build-stage Boardroom checkpoint has a verdict ` +
        `transcription mismatch -- ${transcriptionResult.reason}. Re-check checkpoints.jsonl ` +
        `against the raw seat output at ${checkpoint.details_ref} before pushing.`,
    };
  }

  const baseRef = checkpoint.commit_sha || 'HEAD~20';
  const changedFiles = getChangedFiles(cwd, baseRef);
  const missingTests = checkTestPresence(cwd, changedFiles);
  if (missingTests.length > 0) {
    return {
      allow: false,
      reason: `Wingman dod-gate: no test file found for: ${missingTests.join(', ')}. Add a test, ` +
        `or mark the change with <!-- wingman:no-test-needed: <reason> --> if it genuinely doesn't ` +
        `need one (e.g. docs/config-only).`,
    };
  }

  const testCmd = detectTestCommand(cwd);
  const testRunResult = runTestSuite(cwd, testCmd);
  if (!testRunResult.ok) {
    return {
      allow: false,
      reason: `Wingman dod-gate: the project's test suite (${testCmd.command} ${testCmd.args.join(' ')}) ` +
        `is failing. A test file existing is not the same as it passing -- fix the failure before ` +
        `pushing.\n${testRunResult.output || ''}`,
    };
  }

  const artifactTexts = findAllBuildArtifactTexts(cwd);
  const threatResult = checkThreatRegisterCleanAcrossArtifacts(artifactTexts);
  if (!threatResult.ok) {
    return {
      allow: false,
      reason: `Wingman dod-gate: the threat register still has an OPEN row. Close it or get ` +
        `explicit founder acceptance (see build.md's Definition-of-Done gate) before pushing.`,
    };
  }

  return { allow: true };
}

export const DodGatePlugin = async ({ directory }) => {
  return {
    'tool.execute.before': async (input, output) => {
      if (input.tool !== 'bash') return;
      const cwd = directory || process.cwd();
      const command = String(output?.args?.command || '');
      const result = evaluateGitPush(command, cwd);
      if (!result.allow) {
        throw new Error(result.reason);
      }
    },
  };
};

export default DodGatePlugin;
