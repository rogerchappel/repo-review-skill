# Release Candidate: repo-review-skill v1.0.0

## Scope
Local repo quality audit CLI and library for agents.

## Capabilities
- **6 inspectors**: package.json, README, tests, CI, examples, LICENSE
- **Ranked output**: critical → low severity, then category priority  
- **Dual format**: JSON report + Markdown summary
- **CLI**: `repo-review-skill <repo> --out review.json --summary review.md`
- **Library**: `review(repoPath) => { summary, issues, reportJson, reportMd }`
- **Agent integration**: Full SKILL.md with examples and safety boundaries
- **Fixture-backed tests**: 5 tests covering structure, inspection, errors, ranking
- **Release verification**: `npm run release:check` covers syntax, tests,
  fixture smoke, npm pack contents, executable bin metadata, and an installed
  tarball CLI smoke, then verifies this fixture transcript against current behavior

## Verification Results
```
$ node --test test/repo-review.test.js
✔ testReviewReturnsStructuredResult — 9 issues found
✔ testPackageInspectorsFlagIssues
✔ testNonExistentPathThrows
✔ testFilePathThrows
✔ testIssuesAreRanked
All tests passed.

$ bin/repo-review-skill.js fixtures/demo-repo --no-fs-write
repo-review-skill scanned fixtures/demo-repo: 9 issue(s) — 0 critical, 3 high, 3 medium, 3 low

$ npm run package:smoke
package smoke passed; checked 10 required files, executable bin metadata, and CLI version output

$ npm run install:smoke
install smoke passed; installed @rogerchappel/repo-review-skill and ran documented command: npm exec -- repo-review-skill --version
```

## Branch Protection
- main is protected (PR required, 1 approval)
- Admins may bypass

## Classification: ship
Ready for immediate use by agent builders for repo quality audits.
