const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { inspectPackage } = require('../src/inspectors/package');
const { inspectReadme } = require('../src/inspectors/readme');
const { inspectTests } = require('../src/inspectors/tests');
const { inspectCI } = require('../src/inspectors/ci');
const { inspectExamples } = require('../src/inspectors/examples');

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-review-inspector-'));
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(dir, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return dir;
}

function issueIds(issues) {
  return issues.map(issue => issue.id);
}

for (const prose of ['Checks placeholder text in templates.', 'Use TODO comments to track future work.']) {
  test(`README explanatory prose is not treated as unfinished: ${prose}`, () => {
    const repo = fixture({
      'README.md': `# Tool\n\n## Installation\nInstall it.\n\n## Usage\n${prose}\n\n## License\nMIT.\n`,
    });
    assert.doesNotMatch(issueIds(inspectReadme(repo)).join(','), /readme-placeholders/);
  });
}

for (const marker of ['TODO: document flags', 'Status: TBD', 'FIXME update this', '<placeholder>', 'Placeholder content goes here']) {
  test(`README unfinished marker is detected: ${marker}`, () => {
    const repo = fixture({ 'README.md': `# Tool\n\n## Installation\nInstall it.\n\n## Usage\nUse it.\n\n## License\nMIT.\n\n${marker}\n` });
    assert.ok(issueIds(inspectReadme(repo)).includes('readme-placeholders'));
  });
}

test('Node built-in test runner is recognized from the package test script', () => {
  const repo = fixture({
    'package.json': JSON.stringify({ scripts: { test: 'node --test test/*.test.js' } }),
    'test/example.test.js': 'throw new Error("not inspected by executing it");\n',
  });
  assert.ok(!issueIds(inspectTests(repo)).includes('tests-no-framework'));
});

test('Node built-in test runner is recognized from a test import', () => {
  const repo = fixture({
    'package.json': JSON.stringify({ scripts: { test: 'node test/example.test.js' } }),
    'test/example.test.js': "const test = require('node:test');\n",
  });
  assert.ok(!issueIds(inspectTests(repo)).includes('tests-no-framework'));
});

test('test directories without an executable test setup remain flagged', () => {
  const repo = fixture({
    'package.json': JSON.stringify({ scripts: { test: 'echo tests' } }),
    'test/example.js': 'module.exports = {};\n',
  });
  assert.ok(issueIds(inspectTests(repo)).includes('tests-no-framework'));
});

test('empty and non-workflow YAML do not satisfy GitHub Actions detection', () => {
  for (const content of ['', '# documentation only\n', 'name: Notes\ndescription: not a workflow\n']) {
    const repo = fixture({ '.github/workflows/placeholder.yml': content });
    assert.ok(issueIds(inspectCI(repo)).includes('ci-missing'));
  }
});

test('an executable GitHub Actions workflow satisfies CI detection', () => {
  const repo = fixture({
    '.github/workflows/ci.yml': 'name: CI\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test\n',
  });
  assert.ok(!issueIds(inspectCI(repo)).includes('ci-missing'));
});

test('an empty examples directory does not satisfy example detection', () => {
  const repo = fixture({ 'package.json': '{}' });
  fs.mkdirSync(path.join(repo, 'examples'));
  assert.ok(issueIds(inspectExamples(repo)).includes('examples-missing'));
});

test('an examples directory containing a file satisfies example detection', () => {
  const repo = fixture({ 'examples/basic.js': 'console.log("example");\n' });
  assert.ok(!issueIds(inspectExamples(repo)).includes('examples-missing'));
});

test('Node built-in test coverage is recognized without nyc or c8', () => {
  const repo = fixture({
    'package.json': JSON.stringify({ scripts: { test: 'node --test --experimental-test-coverage' } }),
    'test/example.test.js': "require('node:test');\n",
  });
  assert.ok(!issueIds(inspectTests(repo)).includes('tests-no-coverage'));
});

test('directly executable JavaScript packages do not require a build script', () => {
  const repo = fixture({
    'package.json': JSON.stringify({ name: 'tool', description: 'A tool', author: 'A', license: 'MIT', main: 'src/index.js', scripts: { test: 'node --test' } }),
  });
  assert.ok(!issueIds(inspectPackage(repo)).includes('pkg-build-script-missing'));
});

test('packages publishing generated output still require a build script', () => {
  const repo = fixture({
    'package.json': JSON.stringify({ name: 'tool', description: 'A tool', author: 'A', license: 'MIT', main: 'dist/index.js', scripts: { test: 'node --test' } }),
  });
  assert.ok(issueIds(inspectPackage(repo)).includes('pkg-build-script-missing'));
});
