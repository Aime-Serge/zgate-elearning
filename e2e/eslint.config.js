import { library } from "@zgate/config/eslint/library";

export default [
  ...library(import.meta.dirname),
  { ignores: ["test-results/**", "playwright-report/**"] },
];
