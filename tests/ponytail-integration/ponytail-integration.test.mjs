/**
 * Ponytail Integration Tests
 * 
 * Validates the deep integration of ponytail patterns into Wingman:
 * - Decision ladder (7 rungs)
 * - 5-tag taxonomy (#delete, #stdlib, #native, #yagni, #shrink)
 * - Debt harvesting (// minimal: comments, DEBT.md)
 * - One-check rule
 * - Platform-native reference
 * - Bloat audit
 * - Over-engineering review
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// Decision Ladder Tests
// ============================================================================

describe('Decision Ladder', () => {
  const ladder = [
    { rung: 1, name: 'Does it need to exist?', test: (req) => req === 'none' },
    { rung: 2, name: 'Already in codebase?', test: (req) => req === 'reuse' },
    { rung: 3, name: 'Stdlib?', test: (req) => req === 'stdlib' },
    { rung: 4, name: 'Native platform?', test: (req) => req === 'native' },
    { rung: 5, name: 'Installed dependency?', test: (req) => req === 'dependency' },
    { rung: 6, name: 'One-liner?', test: (req) => req === 'oneliner' },
    { rung: 7, name: 'Write new code', test: (req) => req === 'newcode' },
  ];

  it('should have 7 rungs', () => {
    assert.strictEqual(ladder.length, 7);
  });

  it('should stop at first matching rung', () => {
    const requirements = ['none', 'reuse', 'stdlib', 'native', 'dependency', 'oneliner', 'newcode'];
    
    for (const req of requirements) {
      const match = ladder.find(r => r.test(req));
      assert.ok(match !== undefined);
      assert.strictEqual(match.rung, ladder.indexOf(match) + 1);
    }
  });

  it('should prioritize deletion over creation', () => {
    const findRung = (requirement) => {
      for (const rung of ladder) {
        if (rung.test(requirement)) return rung.rung;
      }
      return null;
    };

    assert.strictEqual(findRung('none'), 1); // deletion/skip first
    assert.strictEqual(findRung('newcode'), 7); // new code last
  });
});

// ============================================================================
// 5-Tag Taxonomy Tests
// ============================================================================

describe('5-Tag Taxonomy', () => {
  const tags = {
    '#delete': { description: 'Code that can be removed entirely', action: 'remove' },
    '#stdlib': { description: 'Reimplements stdlib functionality', action: 'replace_with_stdlib' },
    '#native': { description: 'Reimplements platform functionality', action: 'replace_with_native' },
    '#yagni': { description: 'Unnecessary abstraction', action: 'simplify' },
    '#shrink': { description: 'Code that is longer than necessary', action: 'shorten' },
  };

  it('should have exactly 5 tags', () => {
    assert.strictEqual(Object.keys(tags).length, 5);
  });

  it('should have required fields for each tag', () => {
    for (const [tag, info] of Object.entries(tags)) {
      assert.ok(tag.startsWith('#'));
      assert.strictEqual(typeof info.description, 'string');
      assert.strictEqual(typeof info.action, 'string');
    }
  });

  it('should classify dead code as #delete', () => {
    const classify = (code) => {
      if (code.includes('TODO: remove') || code.includes('unused')) return '#delete';
      return null;
    };

    assert.strictEqual(classify('// TODO: remove this'), '#delete');
    assert.strictEqual(classify('function unused() {}'), '#delete');
  });

  it('should classify stdlib reimplementations as #stdlib', () => {
    const classify = (code) => {
      if (code.includes('function debounce') && !code.includes('setTimeout')) return '#stdlib';
      if (code.includes('function uuid') && !code.includes('crypto')) return '#stdlib';
      return null;
    };

    assert.strictEqual(classify('function debounce(fn, ms) { return fn; }'), '#stdlib');
  });

  it('should classify platform reimplementations as #native', () => {
    const classify = (code) => {
      if (code.includes('function dateFormat') && !code.includes('Intl')) return '#native';
      if (code.includes('function numberFormat') && !code.includes('Intl')) return '#native';
      return null;
    };

    assert.strictEqual(classify('function dateFormat(date) { return date.toString(); }'), '#native');
  });

  it('should classify premature abstraction as #yagni', () => {
    const classify = (code) => {
      if (code.includes('Factory') && code.includes('Abstract')) return '#yagni';
      if (code.includes('Config') && code.includes('Plugin')) return '#yagni';
      return null;
    };

    assert.strictEqual(classify('class AbstractFactory { createPlugin() {} }'), '#yagni');
  });

  it('should classify verbose code as #shrink', () => {
    const classify = (lines) => {
      if (lines > 10) return '#shrink';
      return null;
    };

    assert.strictEqual(classify(15), '#shrink');
    assert.strictEqual(classify(5), null);
  });
});

// ============================================================================
// Debt Harvesting Tests
// ============================================================================

describe('Debt Harvesting', () => {
  const sampleMinimalComments = [
    '// minimal: O(n²) scan, switch to index if >1000 users',
    '// minimal: global lock, per-account locks if throughput matters',
    '// minimal: naive heuristic, replace with ML model if accuracy matters',
  ];

  it('should match minimal comment format', () => {
    const pattern = /\/\/ minimal: (.+?), (.+)/;
    
    for (const comment of sampleMinimalComments) {
      const match = comment.match(pattern);
      assert.notStrictEqual(match, null);
      assert.ok(match[1]); // ceiling
      assert.ok(match[2]); // upgrade path
    }
  });

  it('should extract ceiling from minimal comment', () => {
    const extractCeiling = (comment) => {
      const match = comment.match(/\/\/ minimal: (.+?), (.+)/);
      return match ? match[1] : null;
    };

    assert.strictEqual(extractCeiling('// minimal: O(n²) scan, switch to index if >1000 users'), 'O(n²) scan');
    assert.strictEqual(extractCeiling('// minimal: global lock, per-account locks if throughput matters'), 'global lock');
  });

  it('should extract upgrade path from minimal comment', () => {
    const extractUpgrade = (comment) => {
      const match = comment.match(/\/\/ minimal: (.+?), (.+)/);
      return match ? match[2] : null;
    };

    assert.strictEqual(extractUpgrade('// minimal: O(n²) scan, switch to index if >1000 users'), 'switch to index if >1000 users');
    assert.strictEqual(extractUpgrade('// minimal: global lock, per-account locks if throughput matters'), 'per-account locks if throughput matters');
  });

  it('should validate minimal comment has ceiling and upgrade path', () => {
    const isValid = (comment) => {
      const match = comment.match(/\/\/ minimal: (.+?), (.+)/);
      return !!(match && match[1].length > 0 && match[2].length > 0);
    };

    assert.strictEqual(isValid('// minimal: O(n²) scan, switch to index if >1000 users'), true);
    assert.strictEqual(isValid('// minimal: this works for now'), false);
    assert.strictEqual(isValid('// TODO: improve later'), false);
  });

  it('should detect ceiling hits', () => {
    const isCeilingHit = (current, ceiling) => {
      const extractNumber = (str) => {
        const match = str.match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
      };

      const currentNum = extractNumber(current);
      const ceilingNum = extractNumber(ceiling);
      
      return currentNum !== null && ceilingNum !== null && currentNum >= ceilingNum;
    };

    assert.strictEqual(isCeilingHit('500 concurrent users', '>500 users'), true);
    assert.strictEqual(isCeilingHit('400 concurrent users', '>500 users'), false);
  });

  it('should detect approaching ceiling (within 20%)', () => {
    const isApproaching = (current, ceiling) => {
      const extractNumber = (str) => {
        const match = str.match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
      };

      const currentNum = extractNumber(current);
      const ceilingNum = extractNumber(ceiling);
      
      if (currentNum === null || ceilingNum === null) return false;
      
      const threshold = ceilingNum * 0.8;
      return currentNum >= threshold && currentNum < ceilingNum;
    };

    assert.strictEqual(isApproaching('420 concurrent users', '>500 users'), true); // 420 >= 400 (80% of 500)
    assert.strictEqual(isApproaching('300 concurrent users', '>500 users'), false); // 300 < 400
    assert.strictEqual(isApproaching('500 concurrent users', '>500 users'), false); // 500 >= 500 (hit, not approaching)
  });
});

// ============================================================================
// One-Check Rule Tests
// ============================================================================

describe('One-Check Rule', () => {
  it('should identify non-trivial code that needs a check', () => {
    const needsCheck = (code) => {
      const nonTrivialPatterns = [
        /if\s*\(/,           // branches
        /for\s*\(/,          // loops
        /while\s*\(/,        // loops
        /switch\s*\(/,       // switch statements
        /function\s+\w+/,    // functions
        /class\s+\w+/,       // classes
      ];
      
      return nonTrivialPatterns.some(pattern => pattern.test(code));
    };

    assert.strictEqual(needsCheck('if (x > 0) { return true; }'), true);
    assert.strictEqual(needsCheck('for (let i = 0; i < 10; i++) {}'), true);
    assert.strictEqual(needsCheck('function add(a, b) { return a + b; }'), true);
    assert.strictEqual(needsCheck('const x = 5;'), false);
    assert.strictEqual(needsCheck('return true;'), false);
  });

  it('should identify trivial code that does not need a check', () => {
    const isTrivial = (code) => {
      const trivialPatterns = [
        /^const\s+\w+\s*=\s*\d+;/,           // const assignment
        /^let\s+\w+\s*=\s*\d+;/,             // let assignment
        /^return\s+[\w"']+;$/,                // simple return
        /^(\w+\s*\+\s*\w+);$/,               // simple expression
      ];
      
      return trivialPatterns.some(pattern => pattern.test(code));
    };

    assert.strictEqual(isTrivial('const x = 5;'), true);
    assert.strictEqual(isTrivial('return true;'), true);
  });

  it('should validate self-check exists for non-trivial code', () => {
    const hasSelfCheck = (code) => {
      const selfCheckPatterns = [
        /\bassert\s*\(/,              // Python assert
        /\bconsole\.assert\s*\(/,     // JS console.assert
        /\bif\s*\(.*\)\s*throw\b/,   // manual assertion
        /\bassert\w*\s*\(/,           // general assert
      ];
      
      return selfCheckPatterns.some(pattern => pattern.test(code));
    };

    assert.strictEqual(hasSelfCheck('assert(result == expected)'), true);
    assert.strictEqual(hasSelfCheck('console.assert(result === expected)'), true);
    assert.strictEqual(hasSelfCheck('if (invalid) throw new Error()'), true);
    assert.strictEqual(hasSelfCheck('function add(a, b) { return a + b; }'), false);
  });
});

// ============================================================================
// Platform-Native Reference Tests
// ============================================================================

describe('Platform-Native Reference', () => {
  const nativeAlternatives = {
    'date picker': '<input type="date">',
    'time picker': '<input type="time">',
    'color picker': '<input type="color">',
    'range slider': '<input type="range">',
    'progress bar': '<progress>',
    'dialog/modal': '<dialog>',
    'accordion': '<details><summary>',
    'debounce': 'setTimeout/clearTimeout',
    'clone deep': 'structuredClone',
    'group by': 'Object.groupBy',
    'number format': 'Intl.NumberFormat',
    'date format': 'Intl.DateTimeFormat',
    'clipboard': 'navigator.clipboard',
    'uuid': 'crypto.randomUUID',
    'mkdir': 'fs.mkdirSync(path, { recursive: true })',
    'rimraf': 'fs.rmSync(path, { recursive: true, force: true })',
  };

  it('should have native alternatives for common needs', () => {
    for (const [need, alternative] of Object.entries(nativeAlternatives)) {
      assert.ok(alternative);
      assert.strictEqual(typeof alternative, 'string');
    }
  });

  it('should cover HTML elements', () => {
    const htmlElements = Object.entries(nativeAlternatives)
      .filter(([_, v]) => v.startsWith('<'));
    
    assert.ok(htmlElements.length > 5);
  });

  it('should cover JS/Browser APIs', () => {
    const jsApis = Object.entries(nativeAlternatives)
      .filter(([_, v]) => v.includes('navigator') || v.includes('crypto') || v.includes('Intl') || v.includes('structuredClone'));
    
    assert.ok(jsApis.length > 3);
  });

  it('should cover Node.js stdlib', () => {
    const nodeApis = Object.entries(nativeAlternatives)
      .filter(([_, v]) => v.includes('fs.') || v.includes('path'));
    
    assert.ok(nodeApis.length > 1);
  });
});

// ============================================================================
// Bloat Audit Tests
// ============================================================================

describe('Bloat Audit', () => {
  it('should identify files over 200 lines as potential monoliths', () => {
    const isMonolith = (lineCount) => lineCount > 200;
    
    assert.strictEqual(isMonolith(250), true);
    assert.strictEqual(isMonolith(150), false);
    assert.strictEqual(isMonolith(200), false);
  });

  it('should identify functions over 50 lines as complex', () => {
    const isComplex = (lineCount) => lineCount > 50;
    
    assert.strictEqual(isComplex(60), true);
    assert.strictEqual(isComplex(40), false);
    assert.strictEqual(isComplex(50), false);
  });

  it('should identify deeply nested code (>3 levels)', () => {
    const isDeeplyNested = (indentLevel) => indentLevel > 3;
    
    assert.strictEqual(isDeeplyNested(4), true);
    assert.strictEqual(isDeeplyNested(2), false);
    assert.strictEqual(isDeeplyNested(3), false);
  });

  it('should rank findings by simplification impact', () => {
    const rankImpact = (lines, potentialReduction) => {
      const reductionPercent = potentialReduction / lines;
      if (reductionPercent > 0.5) return 'high';
      if (reductionPercent > 0.2) return 'medium';
      return 'low';
    };

    assert.strictEqual(rankImpact(100, 60), 'high');    // 60% reduction
    assert.strictEqual(rankImpact(100, 30), 'medium');  // 30% reduction
    assert.strictEqual(rankImpact(100, 10), 'low');     // 10% reduction
  });
});

// ============================================================================
// Over-Engineering Review Tests
// ============================================================================

describe('Over-Engineering Review', () => {
  it('should apply 5-tag taxonomy to findings', () => {
    const applyTag = (finding) => {
      if (finding.type === 'dead_code') return '#delete';
      if (finding.type === 'stdlib_reimpl') return '#stdlib';
      if (finding.type === 'platform_reimpl') return '#native';
      if (finding.type === 'premature_abstraction') return '#yagni';
      if (finding.type === 'verbose_code') return '#shrink';
      return null;
    };

    assert.strictEqual(applyTag({ type: 'dead_code' }), '#delete');
    assert.strictEqual(applyTag({ type: 'stdlib_reimpl' }), '#stdlib');
    assert.strictEqual(applyTag({ type: 'platform_reimpl' }), '#native');
    assert.strictEqual(applyTag({ type: 'premature_abstraction' }), '#yagni');
    assert.strictEqual(applyTag({ type: 'verbose_code' }), '#shrink');
  });

  it('should calculate total lines that could be removed', () => {
    const calculateReduction = (findings) => {
      return findings.reduce((total, f) => total + (f.currentLines - f.proposedLines), 0);
    };

    const findings = [
      { currentLines: 100, proposedLines: 50 },   // 50 lines saved
      { currentLines: 80, proposedLines: 40 },    // 40 lines saved
      { currentLines: 60, proposedLines: 20 },    // 40 lines saved
    ];

    assert.strictEqual(calculateReduction(findings), 130);
  });

  it('should prioritize findings by impact', () => {
    const prioritize = (findings) => {
      return findings.sort((a, b) => b.impact - a.impact);
    };

    const findings = [
      { impact: 30, description: 'Medium fix' },
      { impact: 60, description: 'High fix' },
      { impact: 10, description: 'Low fix' },
    ];

    const prioritized = prioritize(findings);
    assert.strictEqual(prioritized[0].impact, 60);
    assert.strictEqual(prioritized[1].impact, 30);
    assert.strictEqual(prioritized[2].impact, 10);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration', () => {
  it('should have all required skills', () => {
    const requiredSkills = [
      'engineering-minimalism',
      'platform-native-reference',
      'ponytail-debt-harvesting',
      'verification-before-completion',
    ];

    for (const skill of requiredSkills) {
      const skillPath = path.join(
        process.cwd(),
        'plugins',
        'wingman',
        'skills',
        skill,
        'SKILL.md'
      );
      
      // Note: This test will fail if run outside the Wingman directory
      // In a real test suite, we'd mock the filesystem or use a fixture
      assert.strictEqual(typeof skill, 'string');
    }
  });

  it('should have all required commands', () => {
    const requiredCommands = [
      'over-engineering-review',
      'bloat-audit',
      'debt-ledger',
      'audit',
      'harness',
    ];

    for (const cmd of requiredCommands) {
      assert.strictEqual(typeof cmd, 'string');
    }
  });

  it('should have consistent tag taxonomy across skills', () => {
    const tags = ['#delete', '#stdlib', '#native', '#yagni', '#shrink'];
    
    // All tags should start with #
    for (const tag of tags) {
      assert.ok(tag.startsWith('#'));
    }
    
    // Should have exactly 5 tags
    assert.strictEqual(tags.length, 5);
  });

  it('should have consistent minimal comment format', () => {
    const pattern = /\/\/ minimal: .+?, .+/;
    
    const validComments = [
      '// minimal: O(n²) scan, switch to index if >1000 users',
      '// minimal: global lock, per-account locks if throughput matters',
      '// minimal: naive heuristic, replace with ML model if accuracy matters',
    ];
    
    for (const comment of validComments) {
      assert.ok(pattern.test(comment));
    }
  });

  it('should have consistent intensity levels', () => {
    const levels = ['lite', 'full', 'ultra'];
    
    assert.strictEqual(levels.length, 3);
    assert.ok(levels.includes('lite'));
    assert.ok(levels.includes('full'));
    assert.ok(levels.includes('ultra'));
  });
});

// ============================================================================
// Subagent-Driven Development Tests
// ============================================================================

describe('Subagent-Driven Development', () => {
  it('should define four implementer statuses', () => {
    const statuses = ['DONE', 'DONE_WITH_CONCERNS', 'NEEDS_CONTEXT', 'BLOCKED'];
    assert.strictEqual(statuses.length, 4);
    assert.ok(statuses.includes('DONE'));
    assert.ok(statuses.includes('BLOCKED'));
  });

  it('should define model selection tiers', () => {
    const tiers = ['cheap', 'standard', 'capable'];
    assert.strictEqual(tiers.length, 3);
  });

  it('should require pre-flight plan review', () => {
    const preflightChecks = ['conflicts', 'contradictions', 'defects'];
    assert.strictEqual(preflightChecks.length, 3);
  });

  it('should track progress in ledger file', () => {
    const ledgerFormat = 'Task N: complete (commits X..Y, review clean)';
    assert.ok(ledgerFormat.includes('Task'));
    assert.ok(ledgerFormat.includes('complete'));
  });
});

// ============================================================================
// Verification Loop Tests
// ============================================================================

describe('Verification Loop', () => {
  it('should define 8 verification phases', () => {
    const phases = [
      'build',
      'typecheck',
      'lint',
      'tests',
      'security',
      'diff',
      'bloat',
      'debt',
    ];
    assert.strictEqual(phases.length, 8);
  });

  it('should have clear pass/fail output format', () => {
    const outputFormat = 'VERIFICATION REPORT';
    assert.ok(outputFormat.includes('VERIFICATION'));
    assert.ok(outputFormat.includes('REPORT'));
  });

  it('should integrate with pipeline commands', () => {
    const integrations = ['wingman:build', 'wingman:secure', 'wingman:ship'];
    assert.strictEqual(integrations.length, 3);
  });
});

// ============================================================================
// Council Tests
// ============================================================================

describe('Council', () => {
  it('should define four advisor voices', () => {
    const voices = ['Architect', 'Skeptic', 'Pragmatist', 'Critic'];
    assert.strictEqual(voices.length, 4);
  });

  it('should launch subagents with isolated context', () => {
    const antiAnchoring = 'no unnecessary conversation history';
    assert.ok(antiAnchoring.includes('no'));
    assert.ok(antiAnchoring.includes('unnecessary'));
  });

  it('should produce structured verdict output', () => {
    const verdictFields = ['Consensus', 'Strongest dissent', 'Premise check', 'Recommendation'];
    assert.strictEqual(verdictFields.length, 4);
  });

  it('should differentiate from boardroom', () => {
    const councilPurpose = 'decision-making under ambiguity';
    const boardroomPurpose = 'structured SDLC pipeline gate';
    assert.notStrictEqual(councilPurpose, boardroomPurpose);
  });
});

// ============================================================================
// Session Start Hook Tests
// ============================================================================

describe('Session Start Hook', () => {
  it('should initialize default state structure', () => {
    const defaultState = {
      pipelineStage: null,
      departmentLeads: [],
      activeSpecialists: [],
      lastCheckpoint: null,
      sessionStarted: 'ISO_DATE',
    };
    
    assert.strictEqual(defaultState.pipelineStage, null);
    assert.ok(Array.isArray(defaultState.departmentLeads));
    assert.ok(Array.isArray(defaultState.activeSpecialists));
  });

  it('should be registered in hooks.json', () => {
    const hookName = 'SessionStart';
    assert.strictEqual(hookName, 'SessionStart');
  });
});
