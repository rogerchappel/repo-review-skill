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
- **Fixture-backed tests**: 4 tests covering structure, inspection, errors, ranking
- **Release verification**: `npm run release:check` covers syntax, tests,
  fixture smoke, npm pack contents, executable bin metadata, and an installed
  tarball CLI smoke

## Verification Results
```
$ node --test test/repo-review.test.js
✔ testReviewReturnsStructuredResult — 11 issues found
✔ testPackageInspectorsFlagIssues
✔ testNonExistentPathThrows
✔ testIssuesAreRanked
All tests passed.

$ bin/repo-review-skill.js fixtures/demo-repo --no-fs-write
repo-review-skill scanned fixtures/demo-repo: 11 issue(s) — 0 critical, 2 high, 5 medium, 4 low

$ npm run package:smoke
package smoke passed; checked 10 required files, executable bin metadata, and CLI version output

$ npm run install:smoke
install smoke passed; installed @rogerchappel/repo-review-skill and ran repo-review-skill --version
```

## Branch Protection
- main is protected (PR required, 1 approval)
- Admins may bypass

## Classification: ship
Ready for immediate use by agent builders for repo quality audits.
