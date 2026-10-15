import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Low-memory development: at most 2 test workers locally
    // (docs/DEVELOPMENT_LOW_MEMORY.md). CI keeps Vitest's default.
    ...(process.env["CI"] ? {} : { maxWorkers: 2 }),
    include: ["src/**/*.test.ts"],
    // DB-backed tests hash passwords (bcrypt) against a real Postgres; on a
    // shared CI runner they can exceed Vitest's 5 s default.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
    },
  },
});
