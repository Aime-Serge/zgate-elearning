import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Low-memory development: at most 2 test workers locally
    // (docs/DEVELOPMENT_LOW_MEMORY.md). CI keeps Vitest's default.
    ...(process.env["CI"] ? {} : { maxWorkers: 2 }),
  },
});
