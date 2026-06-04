/**
 * Formatter — generate summary strings, JSON, and Markdown reports
 */
function generateSummary(issues, repoPath) {
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const i of issues) { bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1; }
  const total = issues.length;
  return `repo-review-skill scanned ${repoPath}: ${total} issue(s) — ${bySeverity.critical} critical, ${bySeverity.high} high, ${bySeverity.medium} medium, ${bySeverity.low} low`;
}

function generateJsonOutput(issues, repoPath) {
  return JSON.stringify({ repo: repoPath, reviewedAt: new Date().toISOString(), total: issues.length, issues }, null, 2);
}

function generateMarkdown(issues, repoPath) {
  let md = `# Repo Review: ${repoPath}\n\n`;
  md += `Reviewed: ${new Date().toISOString()}\n`;
  md += `Total issues: ${issues.length}\n\n`;

  for (const i of issues) {
    md += `## [${i.severity.toUpperCase()}] ${i.title}\n\n`;
    md += `- **Category**: ${i.category}\n`;
    md += `- **Description**: ${i.description}\n`;
    md += `- **Fix**: ${i.fix}\n\n`;
  }
  return md;
}

module.exports = { generateSummary, generateJsonOutput, generateMarkdown };
