/**
 * License inspector — checks for LICENSE file
 */
const path = require('path');
const fs = require('fs');

function inspectLicense(repoPath, _opts = {}) {
  const issues = [];
  const licenseNames = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'COPYING'];
  let found = null;
  for (const name of licenseNames) {
    const p = path.join(repoPath, name);
    if (fs.existsSync(p)) { found = name; break; }
  }

  if (!found) {
    issues.push({ id: 'license-file-missing', category: 'license', severity: 'high',
      title: 'No LICENSE file found',
      description: 'Without a LICENSE file, users cannot legally use or distribute the code.',
      fix: 'Add a LICENSE file matching the license declared in package.json.' });
  }

  return issues;
}

module.exports = { inspectLicense };
