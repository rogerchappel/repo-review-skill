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
