/**
 * Rank issues by severity and usefulness for an agent to fix.
 */
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function rankIssues(issues) {
  return issues
    .map(i => ({
      ...i,
      _severityRank: SEVERITY_ORDER[i.severity] ?? 99,
      _categoryRank: categoryPriority(i.category),
    }))
    .sort((a, b) => {
      if (a._severityRank !== b._severityRank) return a._severityRank - b._severityRank;
      if (a._categoryRank !== b._categoryRank) return a._categoryRank - b._categoryRank;
      return a.id.localeCompare(b.id);
    })
    .map(({ _severityRank, _categoryRank, ...rest }) => rest);
}

function categoryPriority(cat) {
  // package and license issues come first, then readme, tests, CI, examples
  const order = { package: 0, license: 1, readme: 2, tests: 3, ci: 4, examples: 5 };
  return order[cat] ?? 99;
}

module.exports = { rankIssues };
