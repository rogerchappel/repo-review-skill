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
    if (fs.existsSync(p) && fs.statSync(p).isDirectory() && directoryContainsFile(p)) {
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

function directoryContainsFile(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).some(entry => {
    if (entry.isFile()) return true;
    return entry.isDirectory() && directoryContainsFile(path.join(dir, entry.name));
  });
}

module.exports = { inspectExamples };
