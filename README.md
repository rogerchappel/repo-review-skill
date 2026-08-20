# repo-review-skill

Review any local code repo like a practical maintainer and output prioritized, testable improvement tasks for agents.

## Quickstart

The package is not currently published to the npm registry. Run it from a
source checkout:

```bash
git clone https://github.com/rogerchappel/repo-review-skill.git
cd repo-review-skill
npm install

# Review a repo
npm exec -- repo-review-skill ../my-project --out review.json --summary review.md
npm exec -- repo-review-skill --out review.json --summary review.md ../my-project

# Preview without writing files
npm exec -- repo-review-skill ../my-project --no-fs-write
```

After a future registry publication, the package will also support global
installation and `npx @rogerchappel/repo-review-skill`. Until then, those
registry-based commands will fail.

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
  --version, -v       Show package version
  --help              Show this help
```

Exactly one repository path is required. Options may appear before or after it,
but a second repository operand or a repeated `--out` or `--summary` option is a
usage error. Usage errors are rejected before the repository is reviewed or any
requested output file is created. The CLI exits with status 1 and writes a
specific message to stderr, for example:

```text
Error: unknown option: --bogus
Error: --out requires a file value
Error: --summary requires a file value
Error: unexpected repository operand: ./another-project
Error: duplicate option: --out
Error: duplicate option: --summary
Error: --out path must be outside the reviewed repository: /path/to/project/review.json
```

Both output paths must resolve outside the reviewed repository. The boundary
check rejects the repository root, existing files, nonexistent nested paths,
and relative or traversal spellings that normalize inside it before review or
file writes begin. Choose an external output directory explicitly:

```bash
repo-review-skill ./my-project --out ../reports/review.json --summary ../reports/review.md
```

## Library API

From a source checkout, import the local package root:

```js
const { review } = require('./repo-review-skill');

const result = await review('./my-repo');
console.log(result.summary);
// => { summary, issues, reportJson, reportMd }
```

After registry publication, consumers can replace `./repo-review-skill` with
`@rogerchappel/repo-review-skill`.

`repoPath` must resolve to an existing directory. A nonexistent target rejects
with `repo path does not exist: <absolute-path>`; an existing file or other
non-directory target rejects with `repo path is not a directory: <absolute-path>`.

## Output Example

```
repo-review-skill scanned /Users/roger/my-repo: 8 issue(s) — 1 critical, 3 high, 3 medium, 1 low
```

## Limitations

- Node.js repos only (package.json based) at this time
- Static inspection only; does not run commands or modify repos
- Does not create GitHub issues or PRs automatically

## Safety Notes

- Read-only: output paths inside the target repo are rejected before review
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
npm run install:smoke
npm run release:check
```

Use `npm run release:check` before publishing or opening a release PR. It runs
syntax checks, tests, the fixture-backed CLI smoke, npm pack verification, and
an installed-tarball CLI smoke.

## Release Notes

Keep [CHANGELOG.md](./CHANGELOG.md) updated with user-facing changes before
publishing. For release-candidate review notes, see
[docs/RELEASE_CANDIDATE.md](./docs/RELEASE_CANDIDATE.md).

The release gate also runs `npm run release-candidate:check`, which derives the
demo fixture's issue and severity counts and ensures the checked-in release
candidate transcript and installed command remain current.
