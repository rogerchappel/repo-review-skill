# SKILL: repo-review-skill

## When to Use

Use this skill when:
- You need to audit any code repository for quality, completeness, and maintenance readiness
- You want structured, prioritized findings that another agent can fix
- You are preparing a repo for release, contribution, or long-term maintenance
- You are onboarding to a repo and want to understand what gaps exist

## Required Tools/Inputs

- Node.js 18+ (runtime for the CLI)
- A local repo directory to review

## What It Does

1. Reads `package.json` (if present) — validates name, description, scripts, license, dependencies
2. Reads `README.md` — checks for install/usage sections, placeholders, completeness
3. Scans for test directories and test frameworks in dependencies
4. Detects CI configuration (`.github/workflows/*.yml`, `.gitlab-ci.yml`, etc.)
5. Looks for example/demo directories
6. Checks for a LICENSE file

## Side-Effect Boundaries

- **Read-only**: No modifications to the target repo
- All output files (JSON/Markdown reports) are written to new locations, not the target repo
- No network calls, no git operations, no process spawning against the target

## Approval Requirements

- No approval needed — safe read-only operation
- When used as a precursor to automated fixes, the agent should present findings to the user before applying any suggested changes

## Examples

### CLI

```bash
# Full review with JSON + Markdown output
repo-review-skill ~/projects/my-app --out review.json --summary review.md

# Preview only (no files written)
repo-review-skill ~/projects/my-app --no-fs-write
```

### As agent tool step

```
Step 1: Run repo-review-skill on the target repo with --no-fs-write
Step 2: Parse the JSON report for issues with severity "high" or "critical"
Step 3: Present top 5 prioritized fixes to the user
Step 4: Await approval before generating fix commits
```

## Validation / Verification Workflow

1. Run `npm run smoke` against the included fixture (demo-repo)
2. Run `npm test` to verify all inspectors produce expected results
3. Cross-check findings manually for any false positives
4. Ensure ranked output orders critical issues first

## Output Schema

JSON report shape:
```json
{
  "repo": "/absolute/path",
  "reviewedAt": "2026-06-04T...",
  "total": 8,
  "issues": [
    { "id": "readme-missing-sections", "category": "readme", "severity": "low",
      "title": "...", "description": "...", "fix": "..." }
  ]
}
```
