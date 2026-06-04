const assert = require('assert');
const path = require('path');
const { review } = require('../src/index');

const FIXTURE_DEMO = path.join(__dirname, '..', 'fixtures', 'demo-repo');

// Basic review runs and returns structured data
// (This is a structural test, not an assertion on exact issues)
async function testReviewReturnsStructuredResult() {
  const result = await review(FIXTURE_DEMO);
  assert.ok(result.summary, 'should have a summary');
  assert.ok(Array.isArray(result.issues), 'should have issues array');
  assert.ok(result.reportJson, 'should have JSON report');
  assert.ok(result.reportMd, 'should have Markdown report');
  assert.ok(result.issues.length > 0, `demo-repo should have detectable issues, got ${result.issues.length}`);
  console.log('  ✓ testReviewReturnsStructuredResult — ' + result.issues.length + ' issues found');
}

// Package inspector flags missing scripts
async function testPackageInspectorsFlagIssues() {
  const result = await review(FIXTURE_DEMO);

  // demo-repo has no test framework and no CI
  const testIssue = result.issues.find(i => i.id === 'pkg-test-script-default' || i.id === 'tests-no-framework');
  const ciIssue = result.issues.find(i => i.id === 'ci-missing');
  const readmeIssue = result.issues.find(i => i.id === 'readme-no-install' || i.id === 'readme-placeholders');

  assert.ok(testIssue, 'should flag test or framework issue');
  assert.ok(ciIssue, 'should flag missing CI');
  assert.ok(readmeIssue, 'should flag README issue');
  console.log('  ✓ testPackageInspectorsFlagIssues');
}

// Non-existent path throws
async function testNonExistentPathThrows() {
  try {
    await review('/tmp/this-dir-does-not-exist-xyz123');
    assert.fail('should have thrown');
  } catch (err) {
    assert.ok(err.message.includes('does not exist'));
    console.log('  ✓ testNonExistentPathThrows');
  }
}

// Severity ordering is respected
async function testIssuesAreRanked() {
  const result = await review(FIXTURE_DEMO);
  const severities = result.issues.map(i => severityRank(i.severity));
  for (let i = 1; i < severities.length; i++) {
    assert.ok(severities[i] >= severities[i - 1], `issues should be sorted by severity`);
  }
  console.log('  ✓ testIssuesAreRanked');
}

function severityRank(s) {
  return { critical: 0, high: 1, medium: 2, low: 3 }[s] ?? 99;
}

// Run all tests
(async () => {
  console.log('repo-review-skill tests:');
  await testReviewReturnsStructuredResult();
  await testPackageInspectorsFlagIssues();
  await testNonExistentPathThrows();
  await testIssuesAreRanked();
  console.log('All tests passed.');
})();
