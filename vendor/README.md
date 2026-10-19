# vendor/

A snapshot of the contract packages the **website repository** owns and this repository relies on (README.md, "Contracts"):

| Folder               | Package                    | Used by                                                     |
| -------------------- | -------------------------- | ----------------------------------------------------------- |
| `website-contracts/` | `@zgate/website-contracts` | `tests/contracts` (as a `file:` dependency)                 |
| `brand-ui/`          | `@zgate/brand-ui`          | `tests/contracts`; the frontend may use it the same way      |

**Never edit these files.** They change only through the sync script, which copies the website repository's committed version and records its commit, tree id and checksum in `VENDORED.json`:

```bash
node scripts/sync-contracts.mjs --from ../website    # path to a website checkout
pnpm install                                         # picks up the new copy
pnpm --filter @zgate/elearning-contract-tests test
```

CI runs `node scripts/sync-contracts.mjs --check`, which fails if anything here differs from the recorded checksum.

The first snapshot (2026-10-19) was taken in the z-gate monorepo before the split (ADR-010); its `commit` is the monorepo's (tag `monorepo-final`). The `tree` ids are unchanged by the split, so `git rev-parse <commit>:packages/<name>` in the website repository finds the same content.
