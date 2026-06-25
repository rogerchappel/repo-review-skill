#!/usr/bin/env node
/**
 * repo-review-skill CLI
 *
 * Usage:
 *   repo-review-skill ./repo --out review.json
 *   repo-review-skill ./repo --summary review.md
 *   repo-review-skill ./repo --no-fs-write  (dry run, print only)
 */
const path = require('path');
const fs = require('fs');
const pkg = require('../package.json');
const { review } = require('../src');

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--version') || args.includes('-v')) {
    console.log(pkg.version);
    process.exit(0);
  }

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`repo-review-skill — Review a local code repo like a practical maintainer.

Usage:
  repo-review-skill <repo-path> [options]

Options:
  --out <file>        Write JSON report to file
  --summary <file>    Write Markdown summary to file
  --no-fs-write       Dry-run mode: print reports without writing files
  --version, -v       Show package version
  --help, -h          Show this help

Examples:
  repo-review-skill ./my-project --out review.json
  repo-review-skill ./my-project --summary review.md
  repo-review-skill ./my-project --no-fs-write
`);
    process.exit(0);
  }

  const parsed = parseArgs(args);
  const { repoPath, outFlag, summaryFlag, noFsWrite } = parsed;

  if (!repoPath) {
    console.error('Error: repo path is required');
    process.exit(1);
  }

  const absPath = path.resolve(repoPath);
  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isDirectory()) {
    console.error(`Error: not a directory: ${absPath}`);
    process.exit(1);
  }

  try {
    const result = await review(absPath);

    // Print summary to stdout
    console.log(result.summary);
    console.log(result.reportMd);

    // Write files unless dry-run
    if (!noFsWrite) {
      if (outFlag) {
        const outPath = path.resolve(outFlag);
        fs.writeFileSync(outPath, result.reportJson, 'utf8');
        console.error(`JSON report → ${outPath}`);
      }
      if (summaryFlag) {
        const summaryPath = path.resolve(summaryFlag);
        fs.writeFileSync(summaryPath, result.reportMd, 'utf8');
        console.error(`Markdown summary → ${summaryPath}`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(`Review failed: ${err.message}`);
    process.exit(1);
  }
}

function getFlag(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

function parseArgs(args) {
  const outFlag = getFlag(args, '--out');
  const summaryFlag = getFlag(args, '--summary');
  const noFsWrite = args.includes('--no-fs-write');
  const flagsWithValues = new Set(['--out', '--summary']);
  let repoPath = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (flagsWithValues.has(arg)) {
      i += 1;
      continue;
    }

    if (arg.startsWith('-')) {
      continue;
    }

    repoPath = arg;
    break;
  }

  return { repoPath, outFlag, summaryFlag, noFsWrite };
}

main();
