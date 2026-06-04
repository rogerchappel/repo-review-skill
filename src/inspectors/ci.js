/**
 * CI inspector — checks for GitHub Actions, GitLab CI, or other CI config
 */
const path = require('path');
const fs = require('fs');

function inspectCI(repoPath, _opts = {}) {
  const issues = [];

  const ciIndicators = [
    { path: '.github/workflows', check: (p) => {
      if (!fs.existsSync(p) || !fs.statSync(p).isDirectory()) return false;
      const files = fs.readdirSync(p).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
      return files.length > 0;
    }},
    { path: '.gitlab-ci.yml', check: (p) => fs.existsSync(p) },
    { path: '.circleci/config.yml', check: (p) => fs.existsSync(p) },
    { path: '.travis.yml', check: (p) => fs.existsSync(p) },
    { path: 'azure-pipelines.yml', check: (p) => fs.existsSync(p) },
  ];

  let ciFound = null;
  for (const { path: ciPath, check } of ciIndicators) {
    const fullPath = path.join(repoPath, ciPath);
    if (check(fullPath)) {
      ciFound = ciPath;
      break;
    }
  }

  if (!ciFound) {
    issues.push({ id: 'ci-missing', category: 'ci', severity: 'medium',
      title: 'No CI configuration detected',
      description: 'CI is essential for running tests on pull requests and catching regressions.',
      fix: 'Add a .github/workflows/ci.yml with a basic test run on push and PR.' });
  }

  return issues;
}

module.exports = { inspectCI };
