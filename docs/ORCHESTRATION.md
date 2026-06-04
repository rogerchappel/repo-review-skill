# ORCHESTRATION: repo-review-skill

## Architecture

```
bin/repo-review-skill.js  ← CLI entrypoint
  └── src/index.js        ← review() orchestrator
       ├── src/inspectors/package.js
       ├── src/inspectors/readme.js
       ├── src/inspectors/tests.js
       ├── src/inspectors/ci.js
       ├── src/inspectors/examples.js
       ├── src/inspectors/license.js
       ├── src/ranker.js
       └── src/formatter.js
```

## Data Flow

1. CLI parses args: repo path, output flags, dry-run
2. `review(repoPath)` calls each inspector in parallel order
3. Each inspector returns `Issue[]` objects with id, category, severity, title, description, fix
4. `rankIssues()` sorts by severity (critical→low) then category priority
5. `formatter` produces summary string, JSON report, Markdown report
6. CLI writes files or prints to stdout

## Inspector Pattern

Each inspector follows:
```js
function inspectX(repoPath, opts) {
  const issues = [];
  // Static filesystem checks
  if (problem) {
    issues.push({ id, category, severity, title, description, fix });
  }
  return issues;
}
```

## Adding New Inspector

1. Create file in `src/inspectors/`
2. Follow inspector pattern above
3. Register in `src/index.js`
4. Add fixture test coverage
5. Update this file
