const fs = require('node:fs');
const path = require('node:path');
const { review } = require('../src/index');

const repoRoot = path.resolve(__dirname, '..');
const fixturePath = path.join(repoRoot, 'fixtures', 'demo-repo');
const releaseCandidatePath = path.join(repoRoot, 'docs', 'RELEASE_CANDIDATE.md');

(async () => {
  const result = await review(fixturePath);
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const issue of result.issues) counts[issue.severity] += 1;

  const expectedLines = [
    `✔ testReviewReturnsStructuredResult — ${result.issues.length} issues found`,
    `repo-review-skill scanned fixtures/demo-repo: ${result.issues.length} issue(s) — ${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low`,
    'install smoke passed; installed @rogerchappel/repo-review-skill and ran documented command: npm exec -- repo-review-skill --version',
  ];
  const document = fs.readFileSync(releaseCandidatePath, 'utf8');
  const missing = expectedLines.filter(line => !document.includes(line));

  if (missing.length > 0) {
    console.error('release candidate check failed; update docs/RELEASE_CANDIDATE.md with:');
    for (const line of missing) console.error(`  ${line}`);
    process.exitCode = 1;
    return;
  }

  console.log(`release candidate check passed; fixture transcript records ${result.issues.length} current issues and the installed command`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
