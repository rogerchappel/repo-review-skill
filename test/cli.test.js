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

test('CLI accepts output flags after the repo path', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-review-skill-cli-'));
  const jsonOut = path.join(tmpDir, 'review.json');
  const markdownOut = path.join(tmpDir, 'review.md');

  const result = spawnSync(
    process.execPath,
    [BIN, FIXTURE_DEMO, '--out', jsonOut, '--summary', markdownOut],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(fs.existsSync(jsonOut), 'writes JSON report when --out follows the repo path');
  assert.ok(
    fs.existsSync(markdownOut),
    'writes Markdown report when --summary follows the repo path',
  );
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

for (const scenario of [
  { flag: '--out', target: '.', label: 'repository root' },
  { flag: '--out', target: 'package.json', label: 'existing file' },
  { flag: '--out', target: 'reports/new/review.json', label: 'nonexistent nested path' },
  { flag: '--summary', target: 'reports/../README.md', label: 'normalized Markdown path' },
]) {
  test(`CLI rejects ${scenario.flag} ${scenario.label} inside the reviewed repository`, () => {
    const packagePath = path.join(FIXTURE_DEMO, 'package.json');
    const readmePath = path.join(FIXTURE_DEMO, 'README.md');
    const packageBefore = fs.readFileSync(packagePath);
    const readmeBefore = fs.readFileSync(readmePath);
    const target = path.join(FIXTURE_DEMO, scenario.target);

    const result = spawnSync(process.execPath, [BIN, FIXTURE_DEMO, scenario.flag, target], {
      encoding: 'utf8',
    });

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(
      result.stderr.trim(),
      `Error: ${scenario.flag} path must be outside the reviewed repository: ${path.resolve(target)}`,
    );
    assert.deepEqual(fs.readFileSync(packagePath), packageBefore);
    assert.deepEqual(fs.readFileSync(readmePath), readmeBefore);
    assert.equal(fs.existsSync(path.join(FIXTURE_DEMO, 'reports')), false);
  });
}

for (const scenario of [
  { flag: '--out', targetName: 'package.json', symlinkName: 'review-link.json', label: 'existing file' },
  { flag: '--summary', targetName: 'README.md', symlinkName: 'summary-link.md', label: 'existing file' },
]) {
  test(`CLI rejects ${scenario.flag} symlinked to an ${scenario.label} inside the reviewed repository`, () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-review-skill-symlink-'));
    const linkPath = path.join(tmpDir, scenario.symlinkName);
    const targetInside = path.join(FIXTURE_DEMO, scenario.targetName);
    const targetBefore = fs.readFileSync(targetInside);
    fs.symlinkSync(targetInside, linkPath);

    const result = spawnSync(process.execPath, [BIN, FIXTURE_DEMO, scenario.flag, linkPath], {
      encoding: 'utf8',
    });

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(
      result.stderr.trim(),
      `Error: ${scenario.flag} path must be outside the reviewed repository: ${path.resolve(linkPath)}`,
    );
    assert.deepEqual(
      fs.readFileSync(targetInside),
      targetBefore,
      'does not write through the symlink into the reviewed repository',
    );
  });
}

test('CLI rejects --out whose parent directory is a symlink into the reviewed repository', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-review-skill-symlink-dir-'));
  const linkDir = path.join(tmpDir, 'linked-out');
  fs.symlinkSync(FIXTURE_DEMO, linkDir, 'dir');
  const target = path.join(linkDir, 'review.json');

  const result = spawnSync(process.execPath, [BIN, FIXTURE_DEMO, '--out', target], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(
    result.stderr.trim(),
    `Error: --out path must be outside the reviewed repository: ${path.resolve(target)}`,
  );
  assert.equal(
    fs.existsSync(path.join(FIXTURE_DEMO, 'review.json')),
    false,
    'does not create a report inside the reviewed repository',
  );
});

test('CLI rejects a dangling --summary symlink whose target is inside the reviewed repository', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-review-skill-symlink-dangling-'));
  const linkPath = path.join(tmpDir, 'summary-link.md');
  const targetInside = path.join(FIXTURE_DEMO, 'never-written.md');
  fs.symlinkSync(targetInside, linkPath);

  const result = spawnSync(process.execPath, [BIN, FIXTURE_DEMO, '--summary', linkPath], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(
    result.stderr.trim(),
    `Error: --summary path must be outside the reviewed repository: ${path.resolve(linkPath)}`,
  );
  assert.equal(
    fs.existsSync(targetInside),
    false,
    'does not create the report through a dangling symlink into the reviewed repository',
  );
});

test('CLI rejects an output path inside the reviewed repository when the repo is reached via a symlink', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-review-skill-repo-link-'));
  const repoLink = path.join(tmpDir, 'repo-link');
  fs.symlinkSync(FIXTURE_DEMO, repoLink, 'dir');
  const target = path.join(repoLink, 'package.json');
  const packageBefore = fs.readFileSync(path.join(FIXTURE_DEMO, 'package.json'));

  const result = spawnSync(process.execPath, [BIN, repoLink, '--out', target], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(
    result.stderr.trim(),
    `Error: --out path must be outside the reviewed repository: ${path.resolve(target)}`,
  );
  assert.deepEqual(fs.readFileSync(path.join(FIXTURE_DEMO, 'package.json')), packageBefore);
});

test('CLI allows --out symlinked to a file outside the reviewed repository', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-review-skill-symlink-outside-'));
  const realTarget = path.join(tmpDir, 'external.json');
  const linkPath = path.join(tmpDir, 'review-link.json');
  fs.symlinkSync(realTarget, linkPath);

  const result = spawnSync(process.execPath, [BIN, FIXTURE_DEMO, '--out', linkPath], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /repo-review-skill scanned/);
  assert.ok(fs.existsSync(realTarget), 'writes through the symlink to the external target');
  assert.equal(fs.lstatSync(linkPath).isSymbolicLink(), true, 'keeps the external symlink intact');
  const parsed = JSON.parse(fs.readFileSync(realTarget, 'utf8'));
  assert.equal(parsed.repo, FIXTURE_DEMO);
});

test('CLI rejects unknown options', () => {
  const result = spawnSync(process.execPath, [BIN, FIXTURE_DEMO, '--bogus'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr.trim(), 'Error: unknown option: --bogus');
});

test('CLI rejects a second repository operand before creating outputs', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-review-skill-extra-'));
  const jsonOut = path.join(tmpDir, 'review.json');
  const markdownOut = path.join(tmpDir, 'review.md');
  const secondRepo = path.join(tmpDir, 'another-repo');
  fs.mkdirSync(secondRepo);

  const result = spawnSync(
    process.execPath,
    [BIN, FIXTURE_DEMO, secondRepo, '--out', jsonOut, '--summary', markdownOut],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr.trim(), `Error: unexpected repository operand: ${secondRepo}`);
  assert.equal(fs.existsSync(jsonOut), false);
  assert.equal(fs.existsSync(markdownOut), false);
});

for (const flag of ['--out', '--summary']) {
  test(`CLI rejects duplicate ${flag} before creating either output`, () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-review-skill-duplicate-'));
    const firstOut = path.join(tmpDir, 'first.out');
    const secondOut = path.join(tmpDir, 'second.out');

    const result = spawnSync(
      process.execPath,
      [BIN, FIXTURE_DEMO, flag, firstOut, flag, secondOut],
      { encoding: 'utf8' },
    );

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr.trim(), `Error: duplicate option: ${flag}`);
    assert.equal(fs.existsSync(firstOut), false);
    assert.equal(fs.existsSync(secondOut), false);
  });
}

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
