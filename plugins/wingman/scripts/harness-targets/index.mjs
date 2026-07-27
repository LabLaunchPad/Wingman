// Loads every harness target descriptor in this directory. A new harness is a new descriptor file
// here -- generate-harness-adapters.mjs and check-harness-adapter-drift.mjs both iterate whatever
// this returns, so adding a 7th harness never requires touching either script's own logic.
// See docs/ARCHITECTURE.md §8f.

import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export async function loadHarnessTargets() {
  const files = readdirSync(here)
    .filter((f) => f.endsWith('.mjs') && f !== 'index.mjs')
    .sort();
  const targets = [];
  for (const f of files) {
    const mod = await import(join(here, f));
    targets.push(mod.default);
  }
  return targets;
}
