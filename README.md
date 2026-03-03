# git-archive-export

> Export files from git history. Any commit, branch, or tag. Zero dependencies.

```
gax src/app.js@main
gax src/app.js@abc1234 --output app-v1.js
gax src/@v1.0.0 --output ./v1-src/
gax --diff v1.0.0 v2.0.0 src/
```

## Install

```bash
# Run without installing (npx)
npx git-archive-export --help

# Install globally
npm install -g git-archive-export
```

## Quick Start

```
$ gax src/app.js@main
... prints file contents to stdout ...

$ gax src/app.js@abc1234 --output app-v1.js
✔ Exported src/app.js @ abc1234 → /pwd/app-v1.js (4096 bytes)

$ gax --refs
Branches:
  main
  feature/new-ui
Tags:
  v1.0.0
  v2.0.0
```

## Usage Patterns

### Export a file at any ref

```bash
# Print file to stdout (pipe-friendly)
gax src/app.js@main

# Save to disk at a specific commit hash
gax src/app.js@abc1234 --output app-v1.js

# Use a tag
gax src/app.js@v1.0.0 --output app-legacy.js

# Use a remote branch
gax src/app.js@origin/main
```

### Export a directory

```bash
# Export entire src/ at a tag as .tar (default)
gax src/@v1.0.0 --output ./v1-src.tar

# Export as zip using built-in zlib (no system zip needed)
gax src/ --format zip --output archive.zip

# Export the whole repo root at a ref
gax ./@main --format tar --output snapshot.tar
```

### Diff between refs

```bash
# What changed in src/ between two tags?
gax --diff v1.0.0 v2.0.0 src/

# Full repo diff between two commits
gax --diff abc1234 def5678
```

### File history and blame

```bash
# Show who changed a file and when
gax --log src/app.js

# Git blame for a file at a specific branch
gax --blame src/app.js@main

# Blame at a specific commit
gax --blame src/app.js@abc1234
```

### Check existence

```bash
# Returns exit 0 if file exists, exit 1 if not
gax --exists src/app.js@main

# Use in scripts
if gax --exists config.json@v1.0.0; then
  echo "config existed in v1.0.0"
fi
```

### List refs

```bash
# Show all branches and tags in the repo
gax --refs
```

## Options

| Flag | Short | Description |
|------|-------|-------------|
| `--output <path>` | `-o` | Write to file instead of stdout |
| `--format <fmt>` | | `tar` (default) or `zip` for directory exports |
| `--diff <ref1> <ref2>` | | Show what changed between two refs |
| `--log [path]` | | Git log for a specific file |
| `--blame <path>[@ref]` | | Git blame at ref |
| `--refs` | | List all branches and tags |
| `--exists <path>[@ref]` | | Check if file exists (exit 0/1) |
| `--help` | `-h` | Show help |

## Ref Parsing

The tool splits on the **last** `@`, so refs containing `/` work correctly:

```
src/app.js@origin/main   → path: src/app.js,  ref: origin/main
src/@feature/auth        → path: src/,         ref: feature/auth
src/app.js               → path: src/app.js,   ref: HEAD
```

## Requirements

- Node.js 18+
- `git` in PATH
- Must be run inside a git repository

## Why Zero Dependencies?

Only Node.js built-ins: `fs`, `path`, `child_process`, `zlib`.

- No npm install needed beyond the tool itself
- No supply-chain risk
- Works offline after initial install
- Tiny footprint

## Security

- Uses `execFileSync`/`spawnSync` only — no shell string interpolation, no injection risk
- No network calls
- No credentials or tokens required

---

Built with Node.js · Zero dependencies · MIT License
