/**
 * README inspector — checks README completeness and usefulness
 */
const path = require('path');
const fs = require('fs');

function inspectReadme(repoPath, _opts = {}) {
  const issues = [];
  const readmePath = findReadme(repoPath);

  if (!readmePath) {
    issues.push({ id: 'readme-missing', category: 'readme', severity: 'high',
      title: 'No README found (README.md, README.rst, or README.txt)',
      description: 'Every repo needs a README for discoverability and developer onboarding.',
      fix: 'Create README.md with at least a title, description, and quickstart.' });
    return issues;
  }

  const content = fs.readFileSync(readmePath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());

  if (lines.length < 5) {
    issues.push({ id: 'readme-too-short', category: 'readme', severity: 'medium',
      title: 'README is too short', description: `Only ${lines.length} non-empty lines; likely insufficient for onboarding.`,
      fix: 'Add installation, usage, and contribution sections.' });
  }

  if (!/^#\s/.test(content)) {
    issues.push({ id: 'readme-no-title', category: 'readme', severity: 'low',
      title: 'README has no top-level heading', description: 'A clear H1 title helps GitHub render a project header.',
      fix: 'Add a `# Project Name` heading at the top.' });
  }

  if (!/(?i)(install|usage|quickstart|getting.started)/i.test(content)) {
    issues.push({ id: 'readme-no-install', category: 'readme', severity: 'high',
      title: 'README has no installation or usage section', description: 'Users don\'t know how to get started.',
      fix: 'Add an Install, Quickstart, or Usage section with copy-paste commands.' });
  }

  if (!/(?i)(license|contributing|test|example)/i.test(content)) {
    issues.push({ id: 'readme-missing-sections', category: 'readme', severity: 'low',
      title: 'README lacks license, contributing, test, or example sections', description: 'Common sections help contributors.',
      fix: 'Add at least License and Contributing sections.' });
  }

  // Check for TODO placeholder
  if (/(?i)\b(TBD|TODO|FIXME|placeholder)\b/.test(content)) {
    issues.push({ id: 'readme-placeholders', category: 'readme', severity: 'medium',
      title: 'README contains placeholder text (TBD/TODO/FIXME)', description: 'Placeholders reduce credibility for visitors.',
      fix: 'Replace placeholder text with real content.' });
  }

  return issues;
}

function findReadme(dir) {
  for (const name of ['README.md', 'README.rst', 'README.txt', 'README']) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

module.exports = { inspectReadme };
