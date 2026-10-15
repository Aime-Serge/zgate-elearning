// @ts-check
/**
 * ESLint preset for Next.js apps - the same rules website/frontend, website/backend and
 * legacy/ops use (Next's core-web-vitals + TypeScript configs).
 *
 *   import next from "@zgate/config/eslint/next";
 *   export default next;
 */
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
