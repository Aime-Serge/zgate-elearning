import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal, self-contained server bundle for the container's prod
  // image (apps/web/Dockerfile) - not the full node_modules tree.
  output: "standalone",
  // apps/web is an independent package with its own lockfile
  // (docs/frontend/FRONTEND_ARCHITECTURE.md's structural decision - not
  // an npm workspace with the root backend package). Without this,
  // Turbopack finds the root's lockfile too and guesses the wrong
  // workspace root.
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
};

export default nextConfig;
