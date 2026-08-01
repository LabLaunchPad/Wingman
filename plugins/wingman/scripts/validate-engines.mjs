#!/usr/bin/env node
// Engine-ownership validator. Ships with the plugin (like validate-wkos.mjs) so it can run both
// in Wingman's own CI and, in principle, against a future fork of this structure.
//
// Enforces the rule that keeps 17 engine manifests from being speculative structure with no
// consumer: every command/skill/hook/reference has exactly one engine owner, and no orphans. See
// docs/status/ENGINES.md for the index and engines-check.mjs for the logic.
//
// Scope: commands/**/*.md (excluding README.md navigation docs), skills/*/SKILL.md, hooks/*.mjs,
// agents/*.md, and top-level references/*.md (not the wkos/, harness-adapters/, org-template/
// structured subdirectories, which are document collections, not flat reference docs -- a
// disclosed scoping choice, not an oversight).
//
// Usage: node validate-engines.mjs

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkEngineOwnership } from './engines-check.mjs';

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));

// Perf: utilizes flat accumulator pattern to avoid high memory and GC overhead from recursive spread array copies.
function walk(dir, { maxDepth = Infinity, depth = 0 } = {}, files = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (depth < maxDepth) {
        walk(full, { maxDepth, depth: depth + 1 }, files);
      }
    } else {
      files.push(full);
    }
  }
  return files;
}

function collectRealFiles() {
  const files = [];

  for (const f of walk(join(pluginRoot, 'commands'))) {
    if (f.endsWith('.md') && !f.endsWith('/README.md')) files.push(f);
  }
  for (const f of walk(join(pluginRoot, 'skills'))) {
    if (f.endsWith('/SKILL.md')) files.push(f);
  }
  for (const f of walk(join(pluginRoot, 'hooks'), { maxDepth: 0 })) {
    if (f.endsWith('.mjs')) files.push(f);
  }
  for (const f of walk(join(pluginRoot, 'agents'), { maxDepth: 0 })) {
    if (f.endsWith('.md')) files.push(f);
  }
  for (const f of walk(join(pluginRoot, 'references'), { maxDepth: 0 })) {
    if (f.endsWith('.md')) files.push(f);
  }

  return files.map((f) => relative(pluginRoot, f));
}

function collectEngines() {
  const enginesRoot = join(pluginRoot, 'engines');
  const engines = [];
  let dirs;
  try {
    dirs = readdirSync(enginesRoot, { withFileTypes: true });
  } catch {
    return engines;
  }
  for (const entry of dirs) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(enginesRoot, entry.name, 'ENGINE.md');
    let membersText;
    try {
      membersText = readFileSync(manifestPath, 'utf-8');
    } catch {
      continue;
    }
    engines.push({ name: entry.name, membersText });
  }
  return engines;
}

const realFiles = collectRealFiles();
const engines = collectEngines();

if (engines.length === 0) {
  console.error('FATAL: no ENGINE.md manifests found under engines/ -- nothing to validate against');
  process.exit(1);
}

const { errors } = checkEngineOwnership({ engines, realFiles });

console.log(`${engines.length} engine(s), ${realFiles.length} real file(s) checked.`);

if (errors.length) {
  console.log(`\n${errors.length} problem(s):`);
  for (const e of errors) console.log(`  - ${e}`);
  console.log('\nFAIL');
  process.exit(1);
}

console.log('\nPASS');
