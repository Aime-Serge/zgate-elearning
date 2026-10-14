// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  {
    // frontend/ is a separate package, a sibling directory now (not a
    // subdirectory of this one), with its own eslint.config.mjs and its
    // own `npm run lint` (docs/frontend/FRONTEND_ARCHITECTURE.md's
    // structural decision) - `eslint .` run from within backend/ never
    // reaches it, so no ignore entry for it is needed here.
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Enforced elsewhere throughout this engagement's docs: no unexplained
      // shortcuts. `any` defeats the point of choosing TypeScript (ADR-003).
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Tooling configs and deploy-time scripts live outside tsconfig.json's
    // `include: ["src"]` (deliberately - see tsconfig.json and
    // scripts/migrate.mjs's own "plain Node, not TypeScript" reasoning),
    // so they can't use the type-aware project service. Base recommended
    // rules are enough for these; they don't need type-checked linting.
    files: ["eslint.config.js", "vitest.config.ts", "scripts/**/*.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    // scripts/migrate.mjs runs directly under `node`, not bundled/
    // transpiled - it needs Node's real global namespace (process,
    // console) declared, which the browser-oriented defaults above don't
    // include.
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
);
