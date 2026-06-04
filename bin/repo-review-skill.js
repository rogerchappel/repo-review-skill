#!/usr/bin/env node
/**
 * repo-review-skill CLI
 *
 * Usage:
 *   repo-review-skill ./repo --out review.json
 *   repo-review-skill ./repo --summary review.md
 */
const path = require('path');
const fs = require('fs');
const { review } = require('../src/index');

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: repo-review-skill <repo-path> [options]
Options:
  --out <file>        Write JSON report to <file>
  --summary <file>    Write Markdown summary to <file>
  --no-fs-write       Preview mode: print reports without writing files
  --help              Show this help`);
    process.exit(0);
  }

  const repoPath = args.find(a => !a.startsWith('--'));
  const outFile = extractFlag(args, '--out');
  const summaryFile = extractFlag(args, '--summary');
  const dryRun = args.includes('--no-fs-write');

  try {
    const result = await review(repoPath);

    // Always print summary to stdout
    console.log(result.summary);
    console.log('');
    console.log(result.reportMd);

    // Write files unless dry-run
    if (!dryRun) {
      if (outFile) {
        fs.writeFileSync(path.resolve(outFile), result.reportJson, 'utf8');
        console.error(`✓ Wrote JSON report → ${outFile}`);
      }
      if (summaryFile) {
        fs.writeFileSync(path.resolve(summaryFile), result.reportMd, 'utf8');
        console.error(`✓ Wrote Markdown summary → ${summaryFile}`);
      }
      // Default: write review.json if --out not specified
      if (!outFile && repoPath) {
        const defaultOut = path.join(repoPath, '_repo-review.json');
        fs.writeFileSync(defaultOut, result.reportJson, 'utf8');
        console.error(`✓ Wrote default JSON report → ${defaultOut}`);
      }
    }

    process.exit(result.issues.length > 0 ? 1 : 0);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(2);
  }
}

function extractFlag(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

main();
