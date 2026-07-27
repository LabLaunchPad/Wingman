/**
 * context-monitor.mjs + session-health.mjs (Codex CLI adapter) Unit Tests
 *
 * Both hooks are PostToolUse, ported from the canonical
 * plugins/wingman/hooks/{context-monitor,session-health}.mjs. session-health's call-count logic
 * ports over with no adaptation (tool_name/cwd are both confirmed PostToolUse input fields per a
 * direct fetch of https://learn.chatgpt.com/docs/hooks, 2026-07-25). context-monitor's scope-creep
 * half required a genuine adaptation -- Codex's apply_patch tool has no separate file_path field
 * the way Claude Code's Edit/Write do, so file paths are parsed out of the apply_patch V4A patch
 * header text instead (see the adapter file's own header comment for the full disclosure: this
 * specific parsing choice is a reasonable inference, not an independently-cited field mapping).
 * These tests cover exactly that adaptation, plus the pure percentage/threshold logic.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computeWarning } from '../../plugins/wingman/references/harness-adapters/codex-cli/.codex/hooks/session-health.mjs';
import { extractEditedPaths, isInsideProject } from '../../plugins/wingman/references/harness-adapters/codex-cli/.codex/hooks/context-monitor.mjs';

describe('Codex CLI session-health.mjs computeWarning()', () => {
  it('returns null under the YELLOW threshold', () => {
    assert.strictEqual(computeWarning(10), null);
    assert.strictEqual(computeWarning(39), null);
  });

  it('returns a YELLOW warning at the 40-call threshold', () => {
    const warning = computeWarning(40);
    assert.strictEqual(warning.level, 'YELLOW');
  });

  it('returns a RED warning at the 60-call threshold', () => {
    const warning = computeWarning(60);
    assert.strictEqual(warning.level, 'RED');
  });

  it('prefers RED over YELLOW once both thresholds are crossed', () => {
    const warning = computeWarning(75);
    assert.strictEqual(warning.level, 'RED');
  });
});

describe('Codex CLI context-monitor.mjs extractEditedPaths()', () => {
  it('extracts a single file path from an apply_patch "Update File" header', () => {
    const command = '*** Begin Patch\n*** Update File: src/server.js\n@@ ...\n*** End Patch';
    const paths = extractEditedPaths('apply_patch', { command });
    assert.deepStrictEqual(paths, ['src/server.js']);
  });

  it('extracts multiple file paths across Add/Update/Delete headers in one patch', () => {
    const command = [
      '*** Begin Patch',
      '*** Add File: new-file.js',
      '@@',
      '*** Update File: src/existing.js',
      '@@',
      '*** Delete File: old/legacy.js',
      '*** End Patch',
    ].join('\n');
    const paths = extractEditedPaths('apply_patch', { command });
    assert.deepStrictEqual(paths, ['new-file.js', 'src/existing.js', 'old/legacy.js']);
  });

  it('returns no paths for an apply_patch command with no recognizable header', () => {
    const paths = extractEditedPaths('apply_patch', { command: 'not a real patch' });
    assert.deepStrictEqual(paths, []);
  });

  it('still handles a direct file_path field for Edit/Write, for forward compatibility', () => {
    const paths = extractEditedPaths('Edit', { file_path: '/some/project/file.js' });
    assert.deepStrictEqual(paths, ['/some/project/file.js']);
  });

  it('returns no paths for unrelated tools (e.g. Bash)', () => {
    const paths = extractEditedPaths('Bash', { command: 'ls -la' });
    assert.deepStrictEqual(paths, []);
  });
});

describe('Codex CLI context-monitor.mjs isInsideProject()', () => {
  it('treats the project root itself as inside', () => {
    assert.strictEqual(isInsideProject('/home/user/project', '/home/user/project'), true);
  });

  it('treats a nested file as inside', () => {
    assert.strictEqual(isInsideProject('/home/user/project/src/app.js', '/home/user/project'), true);
  });

  it('flags a sibling directory as outside (scope creep)', () => {
    assert.strictEqual(isInsideProject('/home/user/other-project/file.js', '/home/user/project'), false);
  });

  it('flags a path that merely shares a prefix (not a real subdirectory) as outside', () => {
    assert.strictEqual(isInsideProject('/home/user/project-extra/file.js', '/home/user/project'), false);
  });
});
