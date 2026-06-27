const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const pkg = require('../package.json');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.stdout.write(result.stdout);
    process.exit(result.status || 1);
  }

  return result;
}

const repoRoot = path.resolve(__dirname, '..');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-review-skill-install-'));
const packResult = run('npm', ['pack', '--silent'], { cwd: repoRoot });
const tarballName = packResult.stdout.trim().split(/\r?\n/).at(-1);
const tarballPath = path.join(repoRoot, tarballName);

try {
  run('npm', ['init', '-y', '--silent'], { cwd: tmpDir });
  run('npm', ['install', '--silent', tarballPath], { cwd: tmpDir });

  const binPath = path.join(tmpDir, 'node_modules', '.bin', 'repo-review-skill');
  const versionResult = run(binPath, ['--version'], { cwd: tmpDir });

  if (versionResult.stdout.trim() !== pkg.version) {
    console.error(`install smoke failed; expected version ${pkg.version}, got ${versionResult.stdout.trim()}`);
    process.exit(1);
  }

  console.log(`install smoke passed; installed ${pkg.name} and ran repo-review-skill --version`);
} finally {
  fs.rmSync(tarballPath, { force: true });
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
