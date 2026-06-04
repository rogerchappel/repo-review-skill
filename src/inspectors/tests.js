/**
 * Tests inspector — checks for test setup and coverage indicators
 */
const path = require('path');
const fs = require('fs');

function inspectTests(repoPath, _opts = {}) {
  const issues = [];
  const pkgPath = path.join(repoPath, 'package.json');
  let hasTestFramework = false;
  let testFrameworks = [];

  // Check for test files/ dirs
  const testDirs = ['test', 'tests', '__tests__', 'spec', 'specs'];
  let testDirFound = null;
  for (const d of testDirs) {
    const p = path.join(repoPath, d);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      testDirFound = p;
      break;
    }
  }

  // Check package.json for test deps
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      const knownFrameworks = ['jest', 'mocha', 'tap', 'ava', 'vitest', 'jasmine', 'tape'];
      for (const fw of knownFrameworks) {
        if (allDeps[fw]) {
          hasTestFramework = true;
          testFrameworks.push(fw);
        }
      }
    } catch { /* already flagged by package inspector */ }
  }

  if (!testDirFound && !hasTestFramework) {
    issues.push({ id: 'tests-missing', category: 'tests', severity: 'high',
      title: 'No test directory or test framework detected',
      description: 'Without tests, regressions go undetected and contributors lack safety.',
      fix: 'Add a test/ directory with at least one smoke test and install a test framework.' });
    return issues;
  }

  if (testDirFound && !hasTestFramework) {
    issues.push({ id: 'tests-no-framework', category: 'tests', severity: 'medium',
      title: 'Test directory exists but no test framework in dependencies',
      description: 'Test files may not run without a framework installed.',
      fix: 'Install a test framework (jest, vitest, etc.) and configure the test script.' });
  }

  if (!testDirFound && hasTestFramework) {
    issues.push({ id: 'tests-framework-no-dir', category: 'tests', severity: 'medium',
      title: `Test framework (${testFrameworks.join(', ')}) installed but no test directory found`,
      description: 'A test directory helps organize test files.',
      fix: 'Add a test/ or __tests__/ directory.' });
  }

  // Check for coverage config
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (!allDeps['nyc'] && !allDeps['c8'] && !allDeps['@istanbuljs/nyc-config-babel']) {
        issues.push({ id: 'tests-no-coverage', category: 'tests', severity: 'low',
          title: 'No coverage tool configured',
          description: 'Coverage tools help track test completeness.',
          fix: 'Add nyc or c8 for coverage reporting.' });
      }
    } catch {}
  }

  return issues;
}

module.exports = { inspectTests };
