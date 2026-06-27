# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Added installed-package smoke coverage so release checks verify the packed
  tarball can be installed and run through its published CLI bin.
- Expanded package smoke coverage to require `package.json`, packed bin
  metadata, and executable permissions for the CLI entry point.
- Updated CI to run the release check on Node.js 18 and 20.
- Fixed CLI parsing so `--out` and `--summary` can appear before the repo path.
- Added `--version` output for install and package smoke checks.
- Expanded the syntax check to cover the CLI bin, nested source files,
  validation scripts, and tests.
- Replaced duplicate README verification text with release-note guidance.

## 1.0.0

- Initial public release of the local-first repository review skill and CLI.
