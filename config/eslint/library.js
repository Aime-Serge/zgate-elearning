// @ts-check
/**
 * ESLint preset for TypeScript libraries and Node services - the same
 * rules elearning/backend uses. Call with the package's own directory so
 * type-aware linting finds its tsconfig:
 *
 *   import { library } from "@zgate/config/eslint/library";
 *   export default library(import.meta.dirname);
 */
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @param {string} tsconfigRootDir */
export function library(tsconfigRootDir) {
  return tseslint.config(
    { ignores: ["dist/**", "node_modules/**", "coverage/**"] },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir },
        globals: globals.node,
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
      },
    },
    {
      // Config files sit outside the type-checked project.
      files: ["*.config.{js,ts,mjs}", "eslint/**/*.js"],
      extends: [tseslint.configs.disableTypeChecked],
    },
  );
}
