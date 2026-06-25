const { spawnSync } = require('node:child_process');
const pkg = require('../package.json');

const requiredFiles = [
  'bin/repo-review-skill.js',
  'src/index.js',
  'src/formatter.js',
  'fixtures/demo-repo/README.md',
  'fixtures/demo-repo/package.json',
  'docs/RELEASE_CANDIDATE.md',
  'SKILL.md',
  'README.md',
  'LICENSE',
];

const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf8',
});

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status || 1);
}

const [packument] = JSON.parse(result.stdout);
const packedFiles = new Set(packument.files.map((file) => file.path));
const missing = requiredFiles.filter((file) => !packedFiles.has(file));

if (missing.length > 0) {
  console.error(`package smoke failed; missing files: ${missing.join(', ')}`);
  process.exit(1);
}

const versionResult = spawnSync(process.execPath, ['bin/repo-review-skill.js', '--version'], {
  encoding: 'utf8',
});

if (versionResult.status !== 0) {
  process.stderr.write(versionResult.stderr);
  process.exit(versionResult.status || 1);
}

if (versionResult.stdout.trim() !== pkg.version) {
  console.error(`package smoke failed; expected CLI version ${pkg.version}, got ${versionResult.stdout.trim()}`);
  process.exit(1);
}

console.log(`package smoke passed; checked ${requiredFiles.length} required files and CLI version output`);
