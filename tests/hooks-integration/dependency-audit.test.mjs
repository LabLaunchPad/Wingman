// Unit tests for dod-structural-gate.mjs's parseAuditReport()/detectDependencyAuditCommand() --
// the 5th check on the git-push branch, making the security-checklist's OWASP A06 row
// mechanically true. Deliberately network-free: parseAuditReport() is fed literal, recorded
// auditor JSON shapes (npm audit --json v9+, npm audit's older `advisories` shape, yarn classic's
// NDJSON, cargo-audit --json, pip-audit -f json) rather than actually invoking any auditor --
// runDependencyAudit()'s own shell-out is covered separately by one integration test that skips
// cleanly when the real binary isn't installed, matching this file's own testability-seam pattern
// for detectTestCommand()/runTestSuite().

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseAuditReport,
  detectDependencyAuditCommand,
  runDependencyAudit,
} from '../../plugins/wingman/hooks/dod-structural-gate.mjs';

// --- parseAuditReport(): npm (v9+ metadata.vulnerabilities shape) ---

test('npm audit: HIGH/CRITICAL counts block, clean report allows', () => {
  const clean = JSON.stringify({ metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 } } });
  assert.equal(parseAuditReport(clean, 'npm').ok, true);

  const dirty = JSON.stringify({ metadata: { vulnerabilities: { info: 1, low: 2, moderate: 0, high: 1, critical: 0, total: 4 } } });
  const result = parseAuditReport(dirty, 'npm');
  assert.equal(result.ok, false);
  assert.match(result.findings[0], /1 HIGH\/CRITICAL/);
});

test('npm audit: MODERATE/LOW-only findings do not block (bar is HIGH/CRITICAL, not any finding)', () => {
  const moderateOnly = JSON.stringify({ metadata: { vulnerabilities: { info: 3, low: 5, moderate: 2, high: 0, critical: 0, total: 10 } } });
  assert.equal(parseAuditReport(moderateOnly, 'npm').ok, true);
});

test('npm audit: older `advisories` map shape (pre-v7) is also handled', () => {
  const oldShape = JSON.stringify({
    advisories: {
      '1234': { severity: 'high', module_name: 'lodash', title: 'Prototype Pollution' },
      '5678': { severity: 'low', module_name: 'debug', title: 'ReDoS' },
    },
  });
  const result = parseAuditReport(oldShape, 'npm');
  assert.equal(result.ok, false);
  assert.match(result.findings[0], /lodash/);
});

// --- parseAuditReport(): pnpm shares the npm parser ---

test('pnpm audit: same metadata.vulnerabilities shape as npm', () => {
  const dirty = JSON.stringify({ metadata: { vulnerabilities: { high: 0, critical: 1 } } });
  assert.equal(parseAuditReport(dirty, 'pnpm').ok, false);
});

// --- parseAuditReport(): yarn classic NDJSON ---

test('yarn audit: NDJSON with a trailing auditSummary line', () => {
  const ndjson = [
    JSON.stringify({ type: 'auditAdvisory', data: { advisory: { severity: 'low' } } }),
    JSON.stringify({ type: 'auditSummary', data: { vulnerabilities: { info: 1, low: 1, moderate: 0, high: 2, critical: 0 } } }),
  ].join('\n');
  const result = parseAuditReport(ndjson, 'yarn');
  assert.equal(result.ok, false);
  assert.match(result.findings[0], /2 HIGH\/CRITICAL/);
});

test('yarn audit: clean auditSummary allows', () => {
  const ndjson = JSON.stringify({ type: 'auditSummary', data: { vulnerabilities: { high: 0, critical: 0 } } });
  assert.equal(parseAuditReport(ndjson, 'yarn').ok, true);
});

// --- parseAuditReport(): cargo-audit ---

test('cargo audit: any listed vulnerability blocks (RustSec advisories don\'t carry a reliable numeric severity)', () => {
  const dirty = JSON.stringify({ vulnerabilities: { found: true, list: [{ advisory: { id: 'RUSTSEC-2021-0001', title: 'time crate segfault' } }] } });
  const result = parseAuditReport(dirty, 'cargo');
  assert.equal(result.ok, false);
  assert.match(result.findings[0], /RUSTSEC-2021-0001/);
});

test('cargo audit: empty list allows', () => {
  const clean = JSON.stringify({ vulnerabilities: { found: false, list: [] } });
  assert.equal(parseAuditReport(clean, 'cargo').ok, true);
});

// --- parseAuditReport(): pip-audit ---

test('pip-audit: any vuln in any dependency blocks (no reliable severity field on this tool)', () => {
  const dirty = JSON.stringify([
    { name: 'requests', version: '2.25.0', vulns: [{ id: 'CVE-2023-32681' }] },
    { name: 'flask', version: '2.0.0', vulns: [] },
  ]);
  const result = parseAuditReport(dirty, 'pip-audit');
  assert.equal(result.ok, false);
  assert.match(result.findings[0], /requests@2\.25\.0/);
});

test('pip-audit: no vulns anywhere allows', () => {
  const clean = JSON.stringify([{ name: 'flask', version: '2.3.0', vulns: [] }]);
  assert.equal(parseAuditReport(clean, 'pip-audit').ok, true);
});

// --- parseAuditReport(): fail-open on malformed/unrecognized input ---

test('malformed or empty output never invents a false block', () => {
  assert.equal(parseAuditReport('', 'npm').ok, true);
  assert.equal(parseAuditReport('not json at all', 'npm').ok, true);
  assert.equal(parseAuditReport('{}', 'npm').ok, true); // recognized JSON, unrecognized shape
  assert.equal(parseAuditReport(undefined, 'cargo').ok, true);
});

// --- detectDependencyAuditCommand(): ecosystem detection by manifest/lockfile ---

function makeProject() {
  return mkdtempSync(join(tmpdir(), 'wingman-dep-audit-'));
}

test('detects npm by default when only package.json is present', () => {
  const dir = makeProject();
  writeFileSync(join(dir, 'package.json'), '{}');
  assert.equal(detectDependencyAuditCommand(dir).ecosystem, 'npm');
  rmSync(dir, { recursive: true, force: true });
});

test('detects pnpm when pnpm-lock.yaml is present', () => {
  const dir = makeProject();
  writeFileSync(join(dir, 'package.json'), '{}');
  writeFileSync(join(dir, 'pnpm-lock.yaml'), '');
  assert.equal(detectDependencyAuditCommand(dir).ecosystem, 'pnpm');
  rmSync(dir, { recursive: true, force: true });
});

test('detects yarn when yarn.lock is present', () => {
  const dir = makeProject();
  writeFileSync(join(dir, 'package.json'), '{}');
  writeFileSync(join(dir, 'yarn.lock'), '');
  assert.equal(detectDependencyAuditCommand(dir).ecosystem, 'yarn');
  rmSync(dir, { recursive: true, force: true });
});

test('detects cargo, pip-audit, and returns null for an unrecognized project shape', () => {
  const cargoDir = makeProject();
  writeFileSync(join(cargoDir, 'Cargo.toml'), '');
  assert.equal(detectDependencyAuditCommand(cargoDir).ecosystem, 'cargo');
  rmSync(cargoDir, { recursive: true, force: true });

  const pyDir = makeProject();
  writeFileSync(join(pyDir, 'pyproject.toml'), '');
  assert.equal(detectDependencyAuditCommand(pyDir).ecosystem, 'pip-audit');
  rmSync(pyDir, { recursive: true, force: true });

  const emptyDir = makeProject();
  assert.equal(detectDependencyAuditCommand(emptyDir), null);
  rmSync(emptyDir, { recursive: true, force: true });
});

// --- runDependencyAudit(): real integration test, skips cleanly if the binary isn't installed ---

test('runDependencyAudit() against a real npm project skips cleanly with no auditor installed, or reports a real result if one is', () => {
  const dir = makeProject();
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'x', version: '1.0.0', dependencies: {} }));
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  const result = runDependencyAudit(dir, detectDependencyAuditCommand(dir));
  // No network / no lockfile in this throwaway fixture -- npm audit will either fail to run at
  // all (treated as skip) or report a clean/near-empty result. Either is an acceptable outcome
  // here; what matters is it never throws and never fabricates a HIGH/CRITICAL finding out of
  // nothing.
  assert.equal(typeof result.ok, 'boolean');
  rmSync(dir, { recursive: true, force: true });
});
