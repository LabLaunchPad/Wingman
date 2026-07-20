#!/usr/bin/env node
// Exports this project's Wingman-tracked knowledge (.wingman/checkpoints.jsonl,
// .wingman/memory/*.md) into a Google Open Knowledge Format (OKF v0.1) bundle:
// a directory of markdown "concept" files with YAML frontmatter, plus the two
// OKF-reserved filenames (index.md, log.md). See docs/DATABASE.md for the
// source schemas and the "no single unifying view" gap this answers.
//
// Read-only on source data — never rewrites checkpoints.jsonl or memory/*.md.
// Fully regenerates the output bundle directory on every run (safe to re-run).
//
// Deliberately excludes state.json/traceability.json — those are plumbing (a
// stage pointer, an ID counter), not founder-meaningful knowledge to hand to
// another AI tool.
//
// Runnable standalone with zero Claude Code involvement, same pattern as
// dod-pre-push-check.mjs (see docs/ARCHITECTURE.md §8a) — but for knowledge/
// output portability rather than execution portability: the exported bundle
// itself is what's portable, not just the script that makes it.
//
// Usage: node okf-export.mjs [--project-dir <path>] [--out <path>]
//   --project-dir defaults to cwd; --out defaults to <project-dir>/.wingman/okf-export

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MEMORY_FILES = [
  { source: 'MEMORY.md', concept: 'memory-facts', title: 'Project memory — evergreen facts' },
  { source: 'decisions.md', concept: 'decisions', title: 'Project memory — decisions' },
  { source: 'tried.md', concept: 'tried', title: 'Project memory — tried & outcomes' },
];

function yamlScalar(value) {
  // Minimal, safe YAML scalar quoting — always double-quote strings so no
  // hand-rolled escaping-vs-not decision is needed; this is a producer, not
  // a general YAML library.
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function yamlStringList(values) {
  return `[${values.map((v) => yamlScalar(v)).join(', ')}]`;
}

function readCheckpoints(projectDir) {
  const filePath = join(projectDir, '.wingman', 'checkpoints.jsonl');
  if (!existsSync(filePath)) return [];
  const raw = readFileSync(filePath, 'utf-8');
  const checkpoints = [];
  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      checkpoints.push(JSON.parse(line));
    } catch (err) {
      console.error(`okf-export: skipping malformed checkpoints.jsonl line ${i + 1}: ${err.message}`);
    }
  }
  return checkpoints;
}

function readMemoryFile(projectDir, filename) {
  const filePath = join(projectDir, '.wingman', 'memory', filename);
  if (!existsSync(filePath)) return { content: '', exists: false };
  const content = readFileSync(filePath, 'utf-8').trim();
  if (!content) return { content: '', exists: false };
  return { content, exists: true };
}

function slugForCheckpoint(checkpoint) {
  return String(checkpoint.checkpoint_id || 'unknown-checkpoint').replace(/[^a-zA-Z0-9._-]/g, '-');
}

function stageLabel(checkpoint) {
  if (Array.isArray(checkpoint.stage)) return checkpoint.stage.join(', ');
  return checkpoint.stage || 'unknown-stage';
}

function timestampFromCheckpointId(checkpointId) {
  // checkpoint_id is "<ISO-8601-timestamp-with-dashes>-<stage-or-bundle-name>"
  // per docs/DATABASE.md — the timestamp portion is the first 20 chars
  // ("2026-07-14T14-32-00Z"), with hyphens standing in for the colons.
  const match = String(checkpointId || '').match(/^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)/);
  if (!match) return null;
  return match[1].replace('T', 'T').replace(/(\d{2})-(\d{2})-(\d{2})Z$/, '$1:$2:$3Z');
}

function dateFromTimestamp(timestamp) {
  if (!timestamp) return null;
  const match = timestamp.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function checkpointToConceptMarkdown(checkpoint) {
  const stage = stageLabel(checkpoint);
  const bottomLine = checkpoint.bottom_line || 'unknown';
  const timestamp = timestampFromCheckpointId(checkpoint.checkpoint_id);
  const title = `${stage} — ${bottomLine}`;
  const founderDecisionSnippet = checkpoint.founder_decision || '';
  const description = `${bottomLine}: ${founderDecisionSnippet}`.slice(0, 120);
  const tags = ['checkpoint', stage, bottomLine].filter(Boolean);

  const frontmatterLines = [
    '---',
    'type: checkpoint',
    `title: ${yamlScalar(title)}`,
    `description: ${yamlScalar(description)}`,
    `tags: ${yamlStringList(tags)}`,
  ];
  if (timestamp) frontmatterLines.push(`timestamp: ${yamlScalar(timestamp)}`);
  if (checkpoint.scope_ref && checkpoint.scope_ref !== 'diff') {
    frontmatterLines.push(`resource: ${yamlScalar(checkpoint.scope_ref)}`);
  }
  frontmatterLines.push('---', '');

  const date = dateFromTimestamp(timestamp) || 'unknown-date';
  const bodyLines = [`# ${stage} checkpoint — ${date}`, ''];
  bodyLines.push(`**Bottom line:** ${bottomLine}`);
  bodyLines.push(`**Founder decision:** ${checkpoint.founder_decision || 'unknown'}`);
  if (checkpoint.founder_notes) {
    bodyLines.push(`**Founder notes:** ${checkpoint.founder_notes}`);
  }
  bodyLines.push('');

  const seats = Array.isArray(checkpoint.seats) ? checkpoint.seats : [];
  if (seats.length > 0) {
    bodyLines.push('## Seat verdicts', '');
    for (const seat of seats) {
      const seatName = String(seat.seat || 'unknown').toUpperCase();
      bodyLines.push(`- **${seatName}** — ${seat.verdict || 'unknown'}: ${seat.summary || ''}`);
    }
    bodyLines.push('');
  }

  if (checkpoint.details_ref) {
    bodyLines.push(
      `Full seat reasoning: see the original \`${checkpoint.details_ref}\` (not included in this bundle).`,
      ''
    );
  }

  return frontmatterLines.join('\n') + bodyLines.join('\n');
}

function memoryFileToConceptMarkdown(entry, content) {
  const frontmatter = [
    '---',
    'type: memory-fact',
    `title: ${yamlScalar(entry.title)}`,
    `tags: ${yamlStringList(['memory', entry.concept])}`,
    `timestamp: ${yamlScalar(new Date().toISOString())}`,
    '---',
    '',
  ].join('\n');
  return `${frontmatter}${content}\n`;
}

function buildIndexMarkdown(checkpointEntries, memoryEntries) {
  const lines = ['# Index', ''];
  if (checkpointEntries.length > 0) {
    lines.push('## Checkpoints', '');
    for (const entry of checkpointEntries) {
      lines.push(`* [${entry.title}](./${entry.relPath}) - ${entry.description}`);
    }
    lines.push('');
  }
  if (memoryEntries.length > 0) {
    lines.push('## Memory', '');
    for (const entry of memoryEntries) {
      lines.push(`* [${entry.title}](./${entry.relPath}) - project memory: ${entry.concept}`);
    }
    lines.push('');
  }
  if (checkpointEntries.length === 0 && memoryEntries.length === 0) {
    lines.push('_Nothing exported yet — no checkpoints or memory files found in this project._', '');
  }
  return lines.join('\n');
}

function buildLogMarkdown(checkpointEntries, memoryEntries) {
  const byDate = new Map();
  const undated = [];

  for (const entry of checkpointEntries) {
    if (entry.date) {
      if (!byDate.has(entry.date)) byDate.set(entry.date, []);
      byDate.get(entry.date).push(`Checkpoint recorded: ${entry.title}`);
    } else {
      undated.push(`Checkpoint recorded: ${entry.title}`);
    }
  }

  const exportDate = new Date().toISOString().slice(0, 10);
  for (const entry of memoryEntries) {
    if (!byDate.has(exportDate)) byDate.set(exportDate, []);
    byDate
      .get(exportDate)
      .push(`Memory file exported: ${entry.title} (export-time date — per-entry dates aren't separately tracked in this file's prose).`);
  }

  const dates = [...byDate.keys()].sort().reverse();
  const lines = ['# Log', ''];
  for (const date of dates) {
    lines.push(`## ${date}`, '');
    for (const line of byDate.get(date)) lines.push(`- ${line}`);
    lines.push('');
  }
  if (undated.length > 0) {
    lines.push('## Undated', '');
    for (const line of undated) lines.push(`- ${line}`);
    lines.push('');
  }
  if (dates.length === 0 && undated.length === 0) {
    lines.push('_No entries yet._', '');
  }
  return lines.join('\n');
}

function exportBundle(projectDir, outDir) {
  const checkpoints = readCheckpoints(projectDir);
  const memoryResults = MEMORY_FILES.map((entry) => ({
    ...entry,
    ...readMemoryFile(projectDir, entry.source),
  })).filter((entry) => entry.exists);

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const checkpointEntries = [];
  if (checkpoints.length > 0) {
    mkdirSync(join(outDir, 'checkpoints'), { recursive: true });
    for (const checkpoint of checkpoints) {
      const slug = slugForCheckpoint(checkpoint);
      const relPath = `checkpoints/${slug}.md`;
      const markdown = checkpointToConceptMarkdown(checkpoint);
      writeFileSync(join(outDir, relPath), markdown, 'utf-8');
      const timestamp = timestampFromCheckpointId(checkpoint.checkpoint_id);
      checkpointEntries.push({
        relPath,
        title: `${stageLabel(checkpoint)} — ${checkpoint.bottom_line || 'unknown'}`,
        description: `${checkpoint.bottom_line || 'unknown'}: ${checkpoint.founder_decision || ''}`.slice(0, 120),
        date: dateFromTimestamp(timestamp),
      });
    }
  }

  const memoryEntries = [];
  if (memoryResults.length > 0) {
    mkdirSync(join(outDir, 'memory'), { recursive: true });
    for (const entry of memoryResults) {
      const relPath = `memory/${entry.concept}.md`;
      const markdown = memoryFileToConceptMarkdown(entry, entry.content);
      writeFileSync(join(outDir, relPath), markdown, 'utf-8');
      memoryEntries.push({ relPath, title: entry.title, concept: entry.concept });
    }
  }

  writeFileSync(join(outDir, 'index.md'), buildIndexMarkdown(checkpointEntries, memoryEntries), 'utf-8');
  writeFileSync(join(outDir, 'log.md'), buildLogMarkdown(checkpointEntries, memoryEntries), 'utf-8');

  return {
    checkpointCount: checkpoints.length,
    memoryFileCount: memoryResults.length,
    outDir,
  };
}

function parseArgs(argv) {
  const args = { projectDir: process.cwd(), out: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--project-dir') args.projectDir = argv[++i];
    else if (argv[i] === '--out') args.out = argv[++i];
  }
  return args;
}

function main(argv) {
  const { projectDir, out } = parseArgs(argv);
  const outDir = out || join(projectDir, '.wingman', 'okf-export');
  const result = exportBundle(projectDir, outDir);
  console.log(
    `okf-export: ${result.checkpointCount} checkpoint(s) and ${result.memoryFileCount} memory file(s) exported to ${result.outDir}`
  );
}

export {
  readCheckpoints,
  readMemoryFile,
  slugForCheckpoint,
  stageLabel,
  timestampFromCheckpointId,
  checkpointToConceptMarkdown,
  memoryFileToConceptMarkdown,
  buildIndexMarkdown,
  buildLogMarkdown,
  exportBundle,
};

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
