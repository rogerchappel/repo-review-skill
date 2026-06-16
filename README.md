# repo-review-skill

Review any local code repo like a practical maintainer and output prioritized, testable improvement tasks for agents.

## Quickstart

```bash
# Install (optional for use with npx)
npm install -g @rogerchappel/repo-review-skill

# Review a repo
repo-review-skill ./my-project --out review.json --summary review.md

# Or run without installing globally
npx @rogerchappel/repo-review-skill ./my-project --no-fs-write
```

## What It Does

- Inspects package.json for missing scripts, descriptions, and defaults
- Checks README for installation instructions, structure, and placeholder text
- Verifies test setup: framework, directory, coverage
- Detects CI configuration (GitHub Actions, GitLab CI, CircleCI, etc.)
- Looks for examples/demo directories
- Checks for LICENSE file
- Ranks all issues by severity (critical → low) and outputs JSON + Markdown

## CLI Usage

```
Usage: repo-review-skill <repo-path> [options]
Options:
  --out <file>        Write JSON report to <file>
  --summary <file>    Write Markdown summary to <file>
  --no-fs-write       Preview mode: print without writing files
  --help              Show this help
```

## Library API

```js
const { review } = require('@rogerchappel/repo-review-skill');

const result = await review('./my-repo');
console.log(result.summary);
// => { summary, issues, reportJson, reportMd }
```

## Output Example

```
repo-review-skill scanned /Users/roger/my-repo: 8 issue(s) — 1 critical, 3 high, 3 medium, 1 low
```

## Limitations

- Node.js repos only (package.json based) at this time
- Static inspection only; does not run commands or modify repos
- Does not create GitHub issues or PRs automatically

## Safety Notes

- Read-only: no file modifications to the target repo
- No network access or external API calls
- Safe to run on any project without side effects

## For Agents

See [SKILL.md](./SKILL.md) for agent workflow integration.

## Verification

```bash
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

Use `npm run release:check` before publishing or opening a release PR.

## Verification

Use the package scripts as the public smoke gates before publishing or changing CLI behavior.

- `npm run test`
- `npm run smoke`
- `npm run check`
