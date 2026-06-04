/**
 * Examples inspector — checks for examples/demos
 */
const path = require('path');
const fs = require('fs');

function inspectExamples(repoPath, _opts = {}) {
  const issues = [];
  const exampleDirs = ['examples', 'example', 'demo', 'demos', 'samples'];
  let found = null;
  for (const d of exampleDirs) {
    const p = path.join(repoPath, d);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      found = d;
      break;
    }
  }

  if (!found) {
    issues.push({ id: 'examples-missing', category: 'examples', severity: 'low',
      title: 'No examples directory found',
      description: 'Examples help users understand how to use the project.',
      fix: 'Add an examples/ directory with at least one working example.' });
  }

  return issues;
}

module.exports = { inspectExamples };
