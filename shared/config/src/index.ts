/**
 * Import paths of the shared presets, for tooling that needs to list or
 * check them. The presets themselves live next to this package's
 * package.json (tsconfig/, eslint/, prettier.json).
 */
export const PRESETS = {
  prettier: "@zgate/config/prettier",
  tsconfigBase: "@zgate/config/tsconfig/base.json",
  tsconfigLibrary: "@zgate/config/tsconfig/library.json",
  tsconfigNextjs: "@zgate/config/tsconfig/nextjs.json",
  eslintLibrary: "@zgate/config/eslint/library",
  eslintNext: "@zgate/config/eslint/next",
} as const;
