/**
 * warning-relay.js + lib/pending-warnings.js (OpenCode adapter) unit tests
 *
 * Real, in-process verification of the pure queue logic (pushWarning/drainWarnings) and the
 * title-generation-call detection heuristic (isTitleGenerationCall) this adapter uses to close the
 * "warnings never reach the model's own context" gap disclosed in output-scanners.js's and
 * session-monitor.js's own header comments.
 *
 * Does NOT re-test the `experimental.chat.system.transform` OpenCode wiring itself here (that was
 * confirmed via real live `opencode run -m opencode/deepseek-v4-flash-free` sessions against a
 * genuinely free model -- see warning-relay.js's own header comment and the adapter README for the
 * exact commands/output, including the real bug this test suite's title-detection case guards
 * against: a naive first version drained the shared queue into OpenCode's internal title-generator
 * system prompt instead of the real agent's, silently losing every warning).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, rmSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  pushWarning,
  drainWarnings,
} from '../../plugins/wingman/references/harness-adapters/opencode/.opencode/plugin/lib/pending-warnings.js';
import {
  isTitleGenerationCall,
  WarningRelayPlugin,
} from '../../plugins/wingman/references/harness-adapters/opencode/.opencode/plugin/warning-relay.js';

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'wingman-warning-relay-'));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('pending-warnings.js pushWarning/drainWarnings', () => {
  it('drainWarnings returns an empty array when no queue file exists yet', () => {
    withTempDir((dir) => {
      assert.deepStrictEqual(drainWarnings(dir), []);
    });
  });

  it('pushWarning appends and drainWarnings returns then clears the queue', () => {
    withTempDir((dir) => {
      pushWarning(dir, 'first warning');
      pushWarning(dir, 'second warning');
      const queuePath = join(dir, '.wingman', 'pending-warnings.json');
      assert.ok(existsSync(queuePath));
      assert.deepStrictEqual(JSON.parse(readFileSync(queuePath, 'utf-8')), [
        'first warning',
        'second warning',
      ]);

      const drained = drainWarnings(dir);
      assert.deepStrictEqual(drained, ['first warning', 'second warning']);
      // Draining clears the queue -- each warning surfaces exactly once.
      assert.deepStrictEqual(JSON.parse(readFileSync(queuePath, 'utf-8')), []);
      assert.deepStrictEqual(drainWarnings(dir), []);
    });
  });

  it('drainWarnings tolerates a corrupt queue file (falls back to empty)', () => {
    withTempDir((dir) => {
      pushWarning(dir, 'a warning'); // creates .wingman/
      const queuePath = join(dir, '.wingman', 'pending-warnings.json');
      writeFileSync(queuePath, 'not json');
      assert.deepStrictEqual(drainWarnings(dir), []);
    });
  });
});

describe('warning-relay.js isTitleGenerationCall', () => {
  it('identifies OpenCode\'s real title-generator system prompt (byte-for-byte confirmed live)', () => {
    const titleSystem = [
      'You are a title generator. You output ONLY a thread title. Nothing else.\n\n<task>\nGenerate a brief title...',
    ];
    assert.strictEqual(isTitleGenerationCall(titleSystem), true);
  });

  it('does not flag the real agent\'s own system prompt', () => {
    assert.strictEqual(isTitleGenerationCall(['You are opencode, an interactive CLI agent...']), false);
  });

  it('returns false for a non-array input without throwing (defensive against the loader auto-invoke risk)', () => {
    assert.strictEqual(isTitleGenerationCall(undefined), false);
    assert.strictEqual(isTitleGenerationCall(null), false);
    assert.strictEqual(isTitleGenerationCall({ not: 'an array' }), false);
  });
});

describe('warning-relay.js WarningRelayPlugin wiring (in-process, no live OpenCode process)', () => {
  it('skips the title-generation call entirely, leaving the queue intact for the real call', async () => {
    await withTempDirAsync(async (dir) => {
      pushWarning(dir, 'a real warning');
      const plugin = await WarningRelayPlugin({ directory: dir });
      const output = {
        system: ['You are a title generator. You output ONLY a thread title. Nothing else.'],
      };
      await plugin['experimental.chat.system.transform']({ sessionID: 'ses_test' }, output);

      // Title call must not consume the queue.
      assert.strictEqual(output.system.length, 1);
      assert.deepStrictEqual(drainWarnings(dir), ['a real warning']);
    });
  });

  it('injects pending warnings into the real agent call and drains the queue', async () => {
    await withTempDirAsync(async (dir) => {
      pushWarning(dir, 'secret flagged in bash output');
      const plugin = await WarningRelayPlugin({ directory: dir });
      const output = { system: ['You are opencode, an interactive CLI agent.'] };
      await plugin['experimental.chat.system.transform']({ sessionID: 'ses_test' }, output);

      assert.strictEqual(output.system.length, 2);
      assert.match(output.system[1], /secret flagged in bash output/);
      assert.deepStrictEqual(drainWarnings(dir), []); // already drained
    });
  });

  it('is a no-op when there are no pending warnings', async () => {
    await withTempDirAsync(async (dir) => {
      const plugin = await WarningRelayPlugin({ directory: dir });
      const output = { system: ['You are opencode, an interactive CLI agent.'] };
      await plugin['experimental.chat.system.transform']({ sessionID: 'ses_test' }, output);
      assert.strictEqual(output.system.length, 1);
    });
  });

  it('does not throw when output.system is missing or not an array', async () => {
    await withTempDirAsync(async (dir) => {
      pushWarning(dir, 'a warning');
      const plugin = await WarningRelayPlugin({ directory: dir });
      await assert.doesNotReject(() =>
        plugin['experimental.chat.system.transform']({ sessionID: 'ses_test' }, {})
      );
      // Queue is left intact since this wasn't a call we could actually inject into.
      assert.deepStrictEqual(drainWarnings(dir), ['a warning']);
    });
  });
});

async function withTempDirAsync(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'wingman-warning-relay-'));
  try {
    await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
