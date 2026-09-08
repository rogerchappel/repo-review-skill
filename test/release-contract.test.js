const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('repository commits a lockfile and CI uses frozen installs', () => {
  const lockfile = path.join(root, 'package-lock.json');
  assert.equal(fs.existsSync(lockfile), true, 'package-lock.json must be committed');

  const workflow = fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8');
  assert.match(workflow, /^\s*run: npm ci\s*$/m);
  assert.doesNotMatch(workflow, /^\s*run: npm install\s*$/m);
});

test('manifest and CI support the maintained Node.js release line', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const lockfile = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8');

  assert.equal(manifest.engines.node, '>=22');
  assert.equal(lockfile.packages[''].engines.node, '>=22');
  assert.match(workflow, /^\s+- 22\s*$/m);
  assert.match(workflow, /^\s+- 24\s*$/m);
  assert.doesNotMatch(workflow, /^\s+- (?:18|20)\s*$/m);
});
