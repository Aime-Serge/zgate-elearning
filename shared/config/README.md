# @zgate/config

Shared presets so every Z-GATE package formats, type-checks and lints the same way.

| Preset                  | Use it from a package                                                                |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `prettier.json`         | Already active repo-wide: the root `.prettierrc.json` points here.                   |
| `tsconfig/base.json`    | Strict compiler settings every package shares.                                       |
| `tsconfig/library.json` | `"extends": "@zgate/config/tsconfig/library.json"` (shared packages, Node services). |
| `tsconfig/nextjs.json`  | `"extends": "@zgate/config/tsconfig/nextjs.json"` (Next.js apps).                    |
| `eslint/library.js`     | `export default library(import.meta.dirname)`                                        |
| `eslint/next.js`        | `export { default } from "@zgate/config/eslint/next"`                                |

Path options (`outDir`, `rootDir`, `paths`, `include`) stay in each package's own tsconfig, because TypeScript resolves them relative to the file that declares them.

The presets mirror the settings the existing apps (`website/app`, `elearning/backend`, `legacy/ops`) already use. Those apps keep their own config files for now, so adopting the presets there is a separate, reviewable change rather than a side effect of this package.
