const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { inspectPackage } = require('../src/inspectors/package');
const { inspectReadme } = require('../src/inspectors/readme');
const { inspectTests } = require('../src/inspectors/tests');

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
