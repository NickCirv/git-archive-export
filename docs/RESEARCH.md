# git-archive-export — research record

## Revision and scope

- Repository: [NickCirv/git-archive-export](https://github.com/NickCirv/git-archive-export)
- Commit: `438881298667a61607805d42880f3e0d67015471`
- Tree: `97da99a24e5c282878eda0006b3a9bc93ccda7b8`
- Captured: 6 of 6 eligible text files (all eligible text files).
- Recursive tree truncated: `False`.
- Runtime verification: **unverified**; no repository code, installation or test command was executed.

The captured file inventory is broader than the semantic review. Authoring inspected package metadata, entrypoint/argument handling and implementation paths relevant to the claims below, plus test declarations. This is documentation research, not a line-by-line security audit. Generated/binary artifacts, lockfiles and file types outside the acquisition filter were not inspected.

## Claim and evidence

| Claim | Pinned evidence | Status |
| --- | --- | --- |
| Runtime requirement and executable mapping | [package.json](https://github.com/NickCirv/git-archive-export/blob/438881298667a61607805d42880f3e0d67015471/package.json) | verified in manifest; installation unverified |
| Read or export files from a chosen Git revision without switching branches. | [implementation](https://github.com/NickCirv/git-archive-export/blob/438881298667a61607805d42880f3e0d67015471/index.js) | partially verified by static implementation review |
| Operational limits and side effects | [implementation](https://github.com/NickCirv/git-archive-export/blob/438881298667a61607805d42880f3e0d67015471/index.js) and source map in [reference](REFERENCE.md) | partially verified; runtime unverified |
| Test command definition | [package.json](https://github.com/NickCirv/git-archive-export/blob/438881298667a61607805d42880f3e0d67015471/package.json) | verified as a declaration only |

## Findings carried into the rewrite

The archive reflects committed content, not local uncommitted edits. Output paths can overwrite existing files. ZIP creation buffers file data in memory, so large histories or archives need care.

No runtime checks were executed for this documentation review. The committed smoke test checks entrypoint JavaScript syntax; it does not exercise the command behavior.

## Documentation inventory and disposition

| Existing document | Disposition |
| --- | --- |
| [README.md](https://github.com/NickCirv/git-archive-export/blob/438881298667a61607805d42880f3e0d67015471/README.md) | Rewritten overview; historical copy remains at this pinned URL. |

New supporting documents: `docs/REFERENCE.md` and `docs/RESEARCH.md`. No original source or protected legal/security file was changed.

## Protected-file evidence

- `LICENSE` SHA-256 `8edf13ba2a2e443fa49e42493414f6952a4a14b6c407983a7c95162ab37f6265`.

## Remaining verification

Clean installation, useful-command execution, malformed input, side-effect boundaries, platform compatibility and end-to-end tests remain unverified. Package-registry availability and live API destinations were not checked. No performance, customer-adoption, compliance or production-readiness claim is made.

## Captured evidence index

- [LICENSE](https://github.com/NickCirv/git-archive-export/blob/438881298667a61607805d42880f3e0d67015471/LICENSE) · blob `481c289c06c96c07330f8c7dedd847c5c07ca384`.
- [README.md](https://github.com/NickCirv/git-archive-export/blob/438881298667a61607805d42880f3e0d67015471/README.md) · blob `ff8b5dfead26ae5b2ac47388725f59a3e58ee6f5`.
- [package.json](https://github.com/NickCirv/git-archive-export/blob/438881298667a61607805d42880f3e0d67015471/package.json) · blob `f72bde006e6634a0983fe257aa75fd9cf28e0501`.
- [.github/workflows/ci.yml](https://github.com/NickCirv/git-archive-export/blob/438881298667a61607805d42880f3e0d67015471/.github/workflows/ci.yml) · blob `44515034a394670de44454a7a1bd2c7ef0c9836e`.
- [index.js](https://github.com/NickCirv/git-archive-export/blob/438881298667a61607805d42880f3e0d67015471/index.js) · blob `dcc55305d09c22fa254ea66a7b4b277209c86dbf`.
- [test/smoke.test.js](https://github.com/NickCirv/git-archive-export/blob/438881298667a61607805d42880f3e0d67015471/test/smoke.test.js) · blob `ebbccaaf2583b4850575f835313e4b0afd21bff7`.

## Tree files outside the captured text set

These paths were mapped but their contents were not acquired in this research pass:

- `banner.svg`
