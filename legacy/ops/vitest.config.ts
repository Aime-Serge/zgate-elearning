import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirrors tsconfig.json's "@/*" -> "./src/*" path alias, which
      // Next's bundler understands natively but Vite/Vitest does not
      // without this.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.tsx", "src/**/*.test.ts"],
  },
});
