![git-archive-export — Nicholas Ashkar repository collection](assets/nicholas-ashkar/banner.png)

# git-archive-export

Read or export files from a chosen Git revision without switching branches.



<a id="usage"></a>

<a id="requirements"></a>

## What it does

Understands path@ref targets and can export directories as tar or ZIP. Includes --diff, --log, --blame, --refs and --exists inspection modes. See the pinned [implementation](https://github.com/NickCirv/git-archive-export/blob/438881298667a61607805d42880f3e0d67015471/index.js).


<a id="install"></a>

## Quickstart

Node requirement from the inspected manifest: **`>=20`**. Requires Git and a local repository with the relevant history. Commands are source-inspected, not executed in this review.

The following example is **source-inspected, not executed**. It uses a pinned checkout; npm package publication is not assumed. Replace project paths or provide the stated input fixtures before running it.

```bash
git clone https://github.com/NickCirv/git-archive-export.git
cd git-archive-export
git checkout 438881298667a61607805d42880f3e0d67015471
npm install --ignore-scripts
node index.js README.md@HEAD
```

Dependencies are installed with lifecycle scripts disabled in this recipe. Read the package scripts before enabling any lifecycle step required by your environment.

## Usage and reference

`git-archive-export` | `gax` are the executable names declared by the package. [Command reference](docs/REFERENCE.md) covers source-backed options and entry points.

| Control | Behavior in the inspected implementation |
| --- | --- |
| `PATH@REF` | Read or export a committed path |
| `--format zip` | Choose ZIP for a directory export |
| `--output PATH` | Write output instead of stdout |
| `--exists PATH@REF` | Check committed-path existence |

## Limits and operational notes

The archive reflects committed content, not local uncommitted edits. Output paths can overwrite existing files. ZIP creation buffers file data in memory, so large histories or archives need care.

## Development

No runtime checks were executed for this documentation review. The committed smoke test checks entrypoint JavaScript syntax; it does not exercise the command behavior.

| Script | Declared command |
| --- | --- |
| `test` | `node --test` |

Work from the pinned source, keep changes focused, and reproduce the affected behavior with a small fixture before proposing a change. Existing contribution and security policies remain authoritative where present.

## Research and status

[Research record](docs/RESEARCH.md) identifies the inspected revision, source evidence, documentation disposition and verification gaps. Static inspection supports the descriptions here; runtime behavior, dependency installation and current hosted services remain unverified.

## License and author

[License](https://github.com/NickCirv/git-archive-export/blob/438881298667a61607805d42880f3e0d67015471/LICENSE)

[Nicholas Ashkar](https://nicholashkar.com) · Applied AI, systems and consulting.
