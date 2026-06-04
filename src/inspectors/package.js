/**
 * Package inspector — checks package.json health
 */
const path = require('path');
const fs = require('fs');

function inspectPackage(repoPath, _opts = {}) {
  const issues = [];
  const pkgPath = path.join(repoPath, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    return issues; // not a node project, skip
  }

  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch {
    issues.push({
      id: 'pkg-invalid-json',
      category: 'package',
      severity: 'critical',
      title: 'package.json is invalid JSON',
      description: 'package.json cannot be parsed; npm commands will fail.',
      fix: 'Validate and repair package.json syntax.',
    });
    return issues;
  }

  // Required fields
  if (!pkg.name || pkg.name === '' || pkg.name === 'my-project') {
    issues.push({ id: 'pkg-name-missing', category: 'package', severity: 'high',
      title: 'Missing or placeholder package name', description: 'Every published package needs a meaningful name.',
      fix: 'Set a descriptive, unique package name in package.json.' });
  }

  if (!pkg.description || pkg.description === '') {
    issues.push({ id: 'pkg-description-missing', category: 'package', severity: 'medium',
      title: 'Missing package description', description: 'A one-line description helps users discover and understand the package.',
      fix: 'Add a concise description field.' });
  }

  if (!pkg.author && !pkg.authors) {
    issues.push({ id: 'pkg-author-missing', category: 'package', severity: 'low',
      title: 'No author field', description: 'Author attribution helps users reach maintainers.',
      fix: 'Add an author string or object.' });
  }

  if (!pkg.license || pkg.license === 'ISC' && !fs.existsSync(path.join(repoPath, 'LICENSE'))) {
    issues.push({ id: 'pkg-license-default', category: 'package', severity: 'medium',
      title: 'Default or missing license', description: 'Default "ISC" suggests no deliberate license choice.',
      fix: 'Choose an explicit license (MIT, Apache-2.0, etc.) and add a LICENSE file.' });
  }

  // Scripts health
  const hasScripts = pkg.scripts && typeof pkg.scripts === 'object';
  const scripts = hasScripts ? pkg.scripts : {};

  if (!hasScripts || Object.keys(scripts).length === 0) {
    issues.push({ id: 'pkg-scripts-empty', category: 'package', severity: 'high',
      title: 'No npm scripts defined', description: 'Without scripts users cannot run standard commands like test, build, or start.',
      fix: 'Add at minimum test, build, and start scripts.' });
  } else {
    if (!scripts.test || scripts.test === 'echo "Error: no test specified" && exit 1') {
      issues.push({ id: 'pkg-test-script-default', category: 'package', severity: 'high',
        title: 'Default npm test script', description: 'The default test placeholder means no test runner is configured.',
        fix: 'Install a test runner and configure the test script.' });
    }
    if (!scripts.build) {
      issues.push({ id: 'pkg-build-script-missing', category: 'package', severity: 'medium',
        title: 'No build script', description: 'Users cannot run a standard build step.',
        fix: 'Add a build script appropriate for the project type.' });
    }
    if (!scripts.lint) {
      issues.push({ id: 'pkg-lint-script-missing', category: 'package', severity: 'low',
        title: 'No lint script', description: 'A lint script ensures code quality.',
        fix: 'Add a lint script with eslint or equivalent.' });
    }
  }

  // Dependencies
  if (pkg.dependencies && Object.keys(pkg.dependencies).length === 0) {
    delete pkg.dependencies; // cosmetic, no issue
  }

  return issues;
}

module.exports = { inspectPackage };
