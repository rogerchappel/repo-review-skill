const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const BIN = path.join(__dirname, '..', 'bin', 'repo-review-skill.js');
const FIXTURE_DEMO = path.join(__dirname, '..', 'fixtures', 'demo-repo');
const pkg = require('../package.json');

test('CLI prints the package version', () => {
  const result = spawnSync(process.execPath, [BIN, '--version'], { encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stdout.trim(), pkg.version);
});

test('CLI accepts output flags before the repo path', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-review-skill-cli-'));
  const jsonOut = path.join(tmpDir, 'review.json');
  const markdownOut = path.join(tmpDir, 'review.md');

  const result = spawnSync(
    process.execPath,
    [BIN, '--out', jsonOut, '--summary', markdownOut, FIXTURE_DEMO],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /repo-review-skill scanned/);
  assert.ok(fs.existsSync(jsonOut), 'writes JSON report when --out is before the repo path');
  assert.ok(fs.existsSync(markdownOut), 'writes Markdown report when --summary is before the repo path');

  const parsed = JSON.parse(fs.readFileSync(jsonOut, 'utf8'));
  assert.equal(parsed.repo, FIXTURE_DEMO);
  assert.ok(Array.isArray(parsed.issues));
});

test('CLI preview mode does not create requested output files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-review-skill-preview-'));
  const jsonOut = path.join(tmpDir, 'review.json');

  const result = spawnSync(
    process.execPath,
    [BIN, '--out', jsonOut, '--no-fs-write', FIXTURE_DEMO],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Total issues:/);
  assert.equal(fs.existsSync(jsonOut), false, '--no-fs-write keeps preview runs read-only');
});

test('CLI rejects unknown options', () => {
  const result = spawnSync(process.execPath, [BIN, FIXTURE_DEMO, '--bogus'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr.trim(), 'Error: unknown option: --bogus');
});

for (const flag of ['--out', '--summary']) {
  test(`CLI rejects a missing value for ${flag}`, () => {
    const result = spawnSync(process.execPath, [BIN, FIXTURE_DEMO, flag], {
      encoding: 'utf8',
    });

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr.trim(), `Error: ${flag} requires a file value`);
  });

  test(`CLI rejects an option token as the value for ${flag}`, () => {
    const result = spawnSync(
      process.execPath,
      [BIN, FIXTURE_DEMO, flag, '--no-fs-write'],
      { encoding: 'utf8' },
    );

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr.trim(), `Error: ${flag} requires a file value`);
  });
}
