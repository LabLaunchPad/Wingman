/**
 * Hooks Integration Tests
 * 
 * Validates the Wingman hooks:
 * - session-start.mjs initializes state correctly
 * - boardroom-checkpoint.mjs enforces gate rules
 * - hooks.json has correct structure
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { spawnSync } from 'node:child_process';

// ============================================================================
// Session Start Hook Tests
// ============================================================================

describe('Session Start Hook', () => {
  const tempDir = path.join(process.cwd(), '.test-temp-session-start');
  const statePath = path.join(tempDir, '.wingman', 'state.json');
  const hookPath = path.join(process.cwd(), 'plugins', 'wingman', 'hooks', 'session-start.mjs');

  beforeEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should create .wingman directory if it does not exist', () => {
    const wingmanDir = path.join(tempDir, '.wingman');
    assert.ok(!fs.existsSync(wingmanDir));
    
    // Run the hook
    execSync(`node "${hookPath}"`, { cwd: tempDir });
    
    assert.ok(fs.existsSync(wingmanDir));
  });

  it('should create state.json with default structure', () => {
    execSync(`node "${hookPath}"`, { cwd: tempDir });
    
    assert.ok(fs.existsSync(statePath));
    
    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    assert.strictEqual(state.pipelineStage, null);
    assert.ok(Array.isArray(state.departmentLeads));
    assert.ok(Array.isArray(state.activeSpecialists));
    assert.strictEqual(state.lastCheckpoint, null);
    assert.ok(state.sessionStarted);
  });

  it('should not overwrite existing state.json', () => {
    const wingmanDir = path.join(tempDir, '.wingman');
    fs.mkdirSync(wingmanDir, { recursive: true });
    
    const existingState = {
      pipelineStage: 'build',
      departmentLeads: ['dept-engineering'],
      activeSpecialists: [],
      lastCheckpoint: '2026-07-13T00:00:00Z',
      sessionStarted: '2026-07-12T00:00:00Z',
    };
    fs.writeFileSync(statePath, JSON.stringify(existingState, null, 2));
    
    execSync(`node "${hookPath}"`, { cwd: tempDir });
    
    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    assert.strictEqual(state.pipelineStage, 'build'); // Should not be overwritten
    assert.deepStrictEqual(state.departmentLeads, ['dept-engineering']); // Should not be overwritten
  });
});

// ============================================================================
// Hooks.json Structure Tests
// ============================================================================

describe('Hooks.json Structure', () => {
  const hooksPath = path.join(process.cwd(), 'plugins', 'wingman', 'hooks', 'hooks.json');

  it('should exist', () => {
    assert.ok(fs.existsSync(hooksPath));
  });

  it('should be valid JSON', () => {
    const content = fs.readFileSync(hooksPath, 'utf-8');
    assert.doesNotThrow(() => JSON.parse(content));
  });

  it('should have required hook events', () => {
    const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf-8'));
    assert.ok(hooks.hooks);
    assert.ok(hooks.hooks.PreToolUse);
    assert.ok(hooks.hooks.SessionStart);
  });

  it('should have boardroom-checkpoint in PreToolUse', () => {
    const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf-8'));
    const preToolUse = hooks.hooks.PreToolUse;
    
    const exitPlanModeHook = preToolUse.find(h => h.matcher === 'ExitPlanMode');
    assert.ok(exitPlanModeHook);
    assert.ok(exitPlanModeHook.hooks);
    assert.ok(exitPlanModeHook.hooks.length > 0);
  });

  it('should have session-start in SessionStart', () => {
    const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf-8'));
    const sessionStart = hooks.hooks.SessionStart;
    
    assert.ok(sessionStart);
    assert.ok(sessionStart.length > 0);
    assert.ok(sessionStart[0].hooks);
    assert.ok(sessionStart[0].hooks.length > 0);
  });
});

// ============================================================================
// Plugin.json Structure Tests
// ============================================================================

describe('Plugin.json Structure', () => {
  const pluginPath = path.join(process.cwd(), 'plugins', 'wingman', '.claude-plugin', 'plugin.json');

  it('should exist', () => {
    assert.ok(fs.existsSync(pluginPath));
  });

  it('should be valid JSON', () => {
    const content = fs.readFileSync(pluginPath, 'utf-8');
    assert.doesNotThrow(() => JSON.parse(content));
  });

  it('should have 25 skills', () => {
    const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf-8'));
    assert.strictEqual(plugin.skills.length, 25);
  });

  it('should have 18 commands', () => {
    const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf-8'));
    assert.strictEqual(plugin.commands.length, 18);
  });

  it('should have 5 agents', () => {
    const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf-8'));
    assert.strictEqual(plugin.agents.length, 5);
  });

  it('should have all new skills registered', () => {
    const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf-8'));
    const requiredSkills = [
      'test-driven-development',
      'subagent-driven-development',
      'verification-loop',
      'council',
      'ponytail-debt-harvesting',
      'platform-native-reference',
      'anti-rationalization',
      'doubt-driven-development',
      'interview-one-question-at-a-time',
      'evidence-gated-catalog',
      'spec-handler',
      'definition-of-done',
      'security-checklist',
      'testing-patterns',
      'doc-index',
    ];
    
    for (const skill of requiredSkills) {
      assert.ok(
        plugin.skills.some(s => s.includes(skill)),
        `Missing skill: ${skill}`
      );
    }
  });

  it('should have all new commands registered', () => {
    const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf-8'));
    const requiredCommands = [
      'over-engineering-review',
      'bloat-audit',
      'debt-ledger',
    ];
    
    for (const cmd of requiredCommands) {
      assert.ok(
        plugin.commands.some(c => c.includes(cmd)),
        `Missing command: ${cmd}`
      );
    }
  });
});

// ============================================================================
// Boardroom Checkpoint — Gstack "EXIT PLAN MODE GATE" (required plan sections)
// ============================================================================

describe('Boardroom Checkpoint Gstack Gate', () => {
  const hookPath = path.join(process.cwd(), 'plugins', 'wingman', 'hooks', 'boardroom-checkpoint.mjs');
  const tempDir = path.join(process.cwd(), '.test-temp-gstack-gate');

  const MARKER = '## Wingman Boardroom Checkpoint';

  // All seven required sections from gstack's plan-review report shape.
  const ALL_SECTIONS = [
    '## Executive Summary',
    '## Current State',
    '## Problem Statement',
    '## Solution Approach',
    '## Success Criteria',
    '## Timeline',
    '## Risks',
  ].join('\n');

  // An otherwise-approved boardroom checkpoint (marker + "ship it" decision +
  // Timestamp, no "DO NOT SHIP"), with the given plan body preceding it —
  // matching the real shape /wingman:boardroom writes (plan content first,
  // checkpoint block appended at the true end) so the CURRENT-checkpoint
  // check (nothing but the checkpoint's own fields following the marker)
  // passes.
  function approvedCheckpoint(body) {
    return (
      `${body}\n\n` +
      `${MARKER}\n` +
      `Bottom line: GO\n` +
      `Founder decision: ship it\n` +
      `Timestamp: 2026-01-01T00:00:00Z\n`
    );
  }

  function withoutSections(body, ...sections) {
    return sections.reduce((acc, s) => acc.replace(s, '## (removed)'), body);
  }

  function runHook(planText) {
    // Run in a temp dir so no on-disk plan file is picked up as a source.
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });
    const res = spawnSync(
      'node',
      [hookPath],
      { input: JSON.stringify({ tool_name: 'ExitPlanMode', tool_input: { plan: planText }, cwd: tempDir }), encoding: 'utf-8' }
    );
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    return { status: res.status, stderr: res.stderr, stdout: res.stdout };
  }

  it('allows an approved checkpoint that carries all required sections', () => {
    const { status } = runHook(approvedCheckpoint(ALL_SECTIONS));
    assert.strictEqual(status, 0, 'complete plan should pass the gstack gate');
  });

  it('denies an approved checkpoint missing one required section', () => {
    const plan = approvedCheckpoint(withoutSections(ALL_SECTIONS, '## Risks'));
    const { status, stderr } = runHook(plan);
    assert.notStrictEqual(status, 0, 'missing section must block exit');
    assert.match(stderr, /missing required sections/i);
    assert.match(stderr, /## Risks/);
  });

  it('denies an approved checkpoint missing multiple required sections', () => {
    const plan = approvedCheckpoint(
      withoutSections(ALL_SECTIONS, '## Problem Statement', '## Success Criteria')
    );
    const { status, stderr } = runHook(plan);
    assert.notStrictEqual(status, 0);
    assert.match(stderr, /## Problem Statement/);
    assert.match(stderr, /## Success Criteria/);
  });

  it('does not false-block a complete plan lacking only the boardroom marker', () => {
    // All sections present, so the gstack gate passes; the separate
    // boardroom-marker gate is what should deny this one.
    const { status, stderr } = runHook(ALL_SECTIONS);
    assert.notStrictEqual(status, 0, 'no boardroom checkpoint should still be denied');
    assert.doesNotMatch(stderr, /missing required sections/i);
    assert.match(stderr, /hasn't been through a Boardroom checkpoint/i);
  });

  // Regression: an approved plan FILE on disk must not be vetoed by a short
  // inline `plan` summary that lacks the required sections. The gate opens if
  // ANY source is a valid approved checkpoint (per the hook's header contract),
  // so a source without the marker is simply "not approved", not "missing
  // sections". This catches the over-block bug where every ExitPlanMode was
  // denied because the inline summary lacked the 7 `##` sections.
  function runHookWithFile(planFileText, inlinePlanText) {
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'docs', 'wingman', 'plans'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'docs', 'wingman', 'plans', 'plan.md'), planFileText);
    const res = spawnSync(
      'node',
      [hookPath],
      {
        input: JSON.stringify({
          tool_name: 'ExitPlanMode',
          tool_input: { plan: inlinePlanText },
          cwd: tempDir,
        }),
        encoding: 'utf-8',
      }
    );
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    return { status: res.status, stderr: res.stderr, stdout: res.stdout };
  }

  it('does not over-block an approved plan file because the inline summary lacks sections', () => {
    const filePlan = approvedCheckpoint(ALL_SECTIONS);
    const { status } = runHookWithFile(filePlan, 'Short summary, no sections.');
    assert.strictEqual(
      status,
      0,
      'approved plan file should pass even if the inline text lacks sections'
    );
  });
});

// ============================================================================
// Secure Command — gsd-plugin threat register (CLOSED/OPEN gate)
// ============================================================================

describe('Secure Command gsd Threat Register', () => {
  const securePath = path.join(process.cwd(), 'plugins', 'wingman', 'commands', 'secure.md');

  it('should exist', () => {
    assert.ok(fs.existsSync(securePath));
  });

  it('implements the gsd-plugin threat register with CLOSED/OPEN dispositions', () => {
    const content = fs.readFileSync(securePath, 'utf-8');
    assert.match(content, /threat register/i);
    assert.match(content, /CLOSED/i);
    assert.match(content, /OPEN/i);
    assert.match(content, /threats_open\s*>\s*0/i, 'must block advancement while any threat is OPEN');
  });
});

// ============================================================================
// Promoted Skills — structure must meet the project skill standard
// ============================================================================

describe('Promoted Skills Structure', () => {
  const skillsRoot = path.join(process.cwd(), 'plugins', 'wingman', 'skills');
  const promoted = ['spec-handler', 'definition-of-done', 'security-checklist', 'testing-patterns', 'doc-index'];

  for (const name of promoted) {
    const skillPath = path.join(skillsRoot, name, 'SKILL.md');

    it(`${name}: SKILL.md exists`, () => {
      assert.ok(fs.existsSync(skillPath), `missing ${skillPath}`);
    });

    it(`${name}: frontmatter has matching name + Use-when description`, () => {
      const text = fs.readFileSync(skillPath, 'utf-8');
      const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      assert.ok(fm, 'no frontmatter block');
      const fields = {};
      for (const line of fm[1].split(/\r?\n/)) {
        const m = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
        if (m) fields[m[1]] = m[2].trim().replace(/^(["'])(.*)\1$/, '$2');
      }
      assert.strictEqual(fields.name, name);
      assert.match(fields.description, /use when/i, 'description needs a "Use when..." trigger');
    });

    it(`${name}: has the self-detection triad (Rationalizations / Red Flags / Verification)`, () => {
      const text = fs.readFileSync(skillPath, 'utf-8');
      assert.match(text, /##\s*Rationalizations/i);
      assert.match(text, /##\s*Red Flags/i);
      assert.match(text, /##\s*Verification/i);
    });
  }
});
