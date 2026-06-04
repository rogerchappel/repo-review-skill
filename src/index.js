/**
 * repo-review-skill — Inspect a local repo and output prioritized,
 * testable improvement tasks for agents.
 *
 * Library API: review(repoPath, options) => Promise<{ summary, issues, reportJson, reportMd }>
 */
const path = require('path');
const fs = require('fs');
const { inspectPackage } = require('./inspectors/package');
const { inspectReadme } = require('./inspectors/readme');
const { inspectTests } = require('./inspectors/tests');
const { inspectCI } = require('./inspectors/ci');
const { inspectExamples } = require('./inspectors/examples');
const { inspectLicense } = require('./inspectors/license');
const { rankIssues } = require('./ranker');
const { generateSummary, generateJsonOutput, generateMarkdown } = require('./formatter');

/**
 * Run a full review against a local repo directory.
 * @param {string} repoPath - absolute or relative path to the repo root
 * @param {object} options
 * @returns {Promise<object>} { summary, issues, reportJson, reportMd }
 */
async function review(repoPath, options = {}) {
  const absPath = path.resolve(repoPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`repo path does not exist: ${absPath}`);
  }

  const allIssues = [];

  // Run each inspector (they are independent filesystem reads)
  allIssues.push(...await inspectPackage(absPath, options));
  allIssues.push(...await inspectReadme(absPath, options));
  allIssues.push(...await inspectTests(absPath, options));
  allIssues.push(...await inspectCI(absPath, options));
  allIssues.push(...await inspectExamples(absPath, options));
  allIssues.push(...await inspectLicense(absPath, options));

  // Deduplicate by id
  const seen = new Set();
  const uniqueIssues = allIssues.filter(i => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });

  const ranked = rankIssues(uniqueIssues);
  const summary = generateSummary(ranked, absPath);
  const reportJson = generateJsonOutput(ranked, absPath);
  const reportMd = generateMarkdown(ranked, absPath);

  return { summary, issues: ranked, reportJson, reportMd };
}

module.exports = { review };
