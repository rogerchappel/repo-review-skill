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
  const testDirectories = [];
  for (const d of testDirs) {
    const p = path.join(repoPath, d);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      testDirectories.push(p);
    }
  }
  const testDirFound = testDirectories[0] || null;
  const hasTestFiles = testDirectories.some(directoryHasTests);

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
      if (Object.values(pkg.scripts || {}).some(script => /(?:^|\s)node(?:\.exe)?\s+--test(?:\s|$)/.test(script))) {
        hasTestFramework = true;
        testFrameworks.push('node:test');
      }
    } catch { /* already flagged by package inspector */ }
  }

  if (!hasTestFramework && testDirectories.some(directoryUsesNodeTest)) {
    hasTestFramework = true;
    testFrameworks.push('node:test');
  }

  if (testDirFound && !hasTestFiles) {
    issues.push({ id: 'tests-no-files', category: 'tests', severity: 'high',
      title: 'Test directory contains no recognized test files',
      description: 'A test directory or installed framework alone does not provide executable regression coverage.',
      fix: 'Add a test file using a conventional name such as example.test.js, test_example.py, or example_test.go.' });
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
      const scripts = Object.values(pkg.scripts || {});
      const usesNodeCoverage = scripts.some(script => /(?:^|\s)--experimental-test-coverage(?:\s|$)/.test(script));
      if (!allDeps['nyc'] && !allDeps['c8'] && !allDeps['@istanbuljs/nyc-config-babel'] && !usesNodeCoverage) {
        issues.push({ id: 'tests-no-coverage', category: 'tests', severity: 'low',
          title: 'No coverage tool configured',
          description: 'Coverage tools help track test completeness.',
          fix: 'Add nyc or c8 for coverage reporting.' });
      }
    } catch {}
  }

  return issues;
}

function directoryUsesNodeTest(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory() && directoryUsesNodeTest(entryPath)) return true;
    if (entry.isFile() && /\.(?:[cm]?js|ts)$/.test(entry.name)) {
      const content = fs.readFileSync(entryPath, 'utf8');
      if (/\b(?:require\s*\(\s*['"]node:test['"]\s*\)|from\s+['"]node:test['"]|import\s*\(\s*['"]node:test['"]\s*\))/.test(content)) return true;
    }
  }
  return false;
}

function directoryHasTests(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory() && directoryHasTests(entryPath)) return true;
    if (!entry.isFile()) continue;
    if (isConventionalTestFilename(entry.name)) return true;
    if (/\.(?:[cm]?js|tsx?)$/i.test(entry.name)) {
      const content = fs.readFileSync(entryPath, 'utf8');
      if (/\b(?:require\s*\(\s*['"]node:test['"]\s*\)|from\s+['"]node:test['"]|import\s*\(\s*['"]node:test['"]\s*\))/.test(content)) return true;
    }
  }
  return false;
}

function isConventionalTestFilename(filename) {
  const stem = filename.replace(/\.[^.]+$/, '');
  return /(?:^test(?:[-_.]|$)|(?:[-_.](?:test|tests|spec))$|Test$)/.test(stem);
}

module.exports = { inspectTests };
