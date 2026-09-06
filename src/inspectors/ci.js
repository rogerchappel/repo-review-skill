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
      return files.some(file => isGitHubWorkflow(path.join(p, file)));
    }},
    { path: '.gitlab-ci.yml', check: isNonEmptyFile },
    { path: '.circleci/config.yml', check: isNonEmptyFile },
    { path: '.travis.yml', check: isNonEmptyFile },
    { path: 'azure-pipelines.yml', check: isNonEmptyFile },
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

function isNonEmptyFile(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile() && fs.readFileSync(file, 'utf8').trim().length > 0;
}

function isGitHubWorkflow(file) {
  if (!isNonEmptyFile(file)) return false;
  const content = fs.readFileSync(file, 'utf8');
  return /^on\s*:/m.test(content) && /^jobs\s*:\s*\n[ \t]+\S/m.test(content);
}

module.exports = { inspectCI };
