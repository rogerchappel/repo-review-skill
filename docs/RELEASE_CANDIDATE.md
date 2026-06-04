# Release Candidate: repo-review-skill v1.0.0

## Scope
Local repo quality audit CLI and library for agents.

## Changes
- 6 inspectors: package, readme, tests, ci, examples, license
- Ranked issue output (critical → low by severity, then category)
- JSON + Markdown reports
- CLI with `--out`, `--summary`, `--no-fs-write`
- Library API: `review(repoPath) => { summary, issues, reportJson, reportMd }`
- Fixture-backed tests
- SKILL.md for agent workflow integration

## Verification
- `npm test` — 4 tests passing
- `npm run smoke` — CLI runs against demo-repo fixture
- `bash scripts/validate.sh` — structure check

## Known Limitations
- Node.js projects only (package.json based)
- Static analysis only — no runtime execution
- No automated PR/issue creation

## Next Steps
- Add Python and Rust repo support
- Add `--ignore` flag for known issues
- Add JSON Schema validation for output
