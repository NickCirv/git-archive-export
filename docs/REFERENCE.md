# git-archive-export — command reference

[Overview](../README.md) · [Research record](RESEARCH.md)

Describes revision `438881298667a61607805d42880f3e0d67015471`. Commands are source-inspected; no execution results are asserted.

## Workflow

Understands path@ref targets and can export directories as tar or ZIP. Includes --diff, --log, --blame, --refs and --exists inspection modes.

Requires Git and a local repository with the relevant history. Commands are source-inspected, not executed in this review.

```bash
node index.js README.md@HEAD
```

## Commands and controls

| Control | Behavior in the inspected implementation |
| --- | --- |
| `PATH@REF` | Read or export a committed path |
| `--format zip` | Choose ZIP for a directory export |
| `--output PATH` | Write output instead of stdout |
| `--exists PATH@REF` | Check committed-path existence |

## Interpretation and side effects

The archive reflects committed content, not local uncommitted edits. Output paths can overwrite existing files. ZIP creation buffers file data in memory, so large histories or archives need care.

## Implementation reference

- [package.json](https://github.com/NickCirv/git-archive-export/blob/438881298667a61607805d42880f3e0d67015471/package.json)
- [index.js](https://github.com/NickCirv/git-archive-export/blob/438881298667a61607805d42880f3e0d67015471/index.js)
- [test/smoke.test.js](https://github.com/NickCirv/git-archive-export/blob/438881298667a61607805d42880f3e0d67015471/test/smoke.test.js)
