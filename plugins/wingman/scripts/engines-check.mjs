// Pure checks for the engine-ownership rule. Imported by validate-engines.mjs, which supplies the
// real filesystem, and by tests, which supply fake ENGINE.md text and a fake real-file list.
//
// The rule: every command/skill/hook/reference has exactly one engine owner, and no orphans. This
// is what keeps 17 engine manifests from being speculative structure with no consumer -- the same
// standard `scripts/wkos-check.mjs` applies to WKOS documents and `scripts/constitution-check.mjs`
// applies to constitution rules.
//
// Split from the I/O for the same reason those two are: a validator that runs its whole pass at
// import time cannot be tested without executing it as a side effect.

// A `## Members` list item: "- `path/to/file`"
const MEMBER_LINE = /^-\s*`([^`]+)`\s*$/;

/**
 * @param {string} text  an ENGINE.md file's contents
 * @returns {string[]} the declared member paths (may be empty for a not-yet-built engine)
 */
export function parseMembers(text) {
  const membersIdx = text.indexOf('## Members');
  if (membersIdx === -1) return [];
  const rest = text.slice(membersIdx);
  const nextHeadingIdx = rest.slice('## Members'.length).search(/\n## /);
  const block = nextHeadingIdx === -1 ? rest : rest.slice(0, nextHeadingIdx + '## Members'.length);
  const members = [];
  for (const line of block.split('\n')) {
    const m = line.match(MEMBER_LINE);
    if (m) members.push(m[1]);
  }
  return members;
}

/**
 * @param {{ engines: Array<{ name: string, membersText: string }>, realFiles: string[] }} input
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function checkEngineOwnership({ engines, realFiles }) {
  const errors = [];
  const ownerOf = new Map(); // path -> engine name

  for (const engine of engines) {
    for (const member of parseMembers(engine.membersText)) {
      if (ownerOf.has(member)) {
        errors.push(
          `"${member}" is claimed by both "${ownerOf.get(member)}" and "${engine.name}" -- every member must have exactly one engine owner`
        );
        continue;
      }
      ownerOf.set(member, engine.name);
      if (!realFiles.includes(member)) {
        errors.push(`"${engine.name}" declares member "${member}", which does not exist on disk`);
      }
    }
  }

  const orphans = realFiles.filter((f) => !ownerOf.has(f));
  for (const orphan of orphans) {
    errors.push(`"${orphan}" has no engine owner -- every command/skill/hook/reference must belong to exactly one engine`);
  }

  return { errors, warnings: [] };
}
