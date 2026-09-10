// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
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
    // Tooling configs live outside tsconfig.json's `include: ["src"]`
    // (deliberately - see tsconfig.json), so they can't use the
    // type-aware project service. Base recommended rules are enough for
    // config files; they don't need type-checked linting.
    files: ["eslint.config.js", "vitest.config.ts"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
