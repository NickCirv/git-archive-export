<div align="center">

# git-archive-export

**Pull any file or directory out of git history — any commit, branch, or tag.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?labelColor=0B0A09)](LICENSE)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?labelColor=0B0A09)](package.json)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-339933?labelColor=0B0A09)](package.json)

</div>

## Install

```bash
npx github:NickCirv/git-archive-export --help
```

Or install globally:

```bash
npm install -g github:NickCirv/git-archive-export
```

## Usage

```bash
# Print a file from main to stdout
gax src/app.js@main

# Save a file at a specific commit to disk
gax src/app.js@abc1234 -o app-v1.js

# Export a directory as a tar archive at a tag
gax src/@v1.0.0 -o ./v1-src.tar

# Export as zip (built-in zlib, no system zip needed)
gax src/ --format zip -o archive.zip

# Show what changed between two tags
gax --diff v1.0.0 v2.0.0 src/

# File history and blame
gax --log src/app.js
gax --blame src/app.js@main

# List all branches and tags
gax --refs

# Check if a file existed at a ref (exit 0/1)
gax --exists config.json@v1.0.0
```

| Flag | Short | Description |
|------|-------|-------------|
| `--output <path>` | `-o` | Write to file instead of stdout |
| `--format <fmt>` | | `tar` (default) or `zip` for directory exports |
| `--diff <ref1> <ref2>` | | Show what changed between two refs |
| `--log [path]` | | Git log for a file |
| `--blame <path>[@ref]` | | Git blame at a ref |
| `--refs` | | List all branches and tags |
| `--exists <path>[@ref]` | | Check existence (exit 0 = found, exit 1 = not found) |
| `--help` | `-h` | Show help |

## What it does

`gax` wraps `git show`, `git archive`, `git diff`, `git log`, and `git blame` behind a single ergonomic CLI. Ref parsing splits on the **last** `@`, so refs containing `/` work correctly (`origin/main`, `feature/auth`). Directory exports produce `.tar` via native `git archive` or `.zip` via Node's built-in `zlib` — no external archiver needed. All git calls use `execFileSync`/`spawnSync`, never shell string interpolation, so there is no injection risk.

## Requirements

- Node.js 18+
- `git` in PATH
- Must be run inside a git repository

---

<sub>Zero dependencies · Node ≥18 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
