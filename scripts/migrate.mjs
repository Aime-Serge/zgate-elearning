#!/usr/bin/env node
/**
 * Runs the e-learning database migrations as the migration owner role, for
 * local hybrid development:
 *
 *   pnpm db:migrate
 *
 * The API connects as a least-privilege role (database/init/), so
 * backend/.env carries a second URL, DATABASE_MIGRATION_URL, for the owner
 * role. This sets DATABASE_URL to it for the migration command only. CI
 * and production pass the owner URL directly instead.
 *
 * Node built-ins only.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const envPath = "backend/.env";
const migrateArgs = ["--filter", "@zgate/elearning-backend", "db:migrate"];

const root = fileURLToPath(new URL("..", import.meta.url));
const envFile = path.join(root, envPath);
const fromFile = existsSync(envFile) ? parseEnv(readFileSync(envFile, "utf8")) : {};
const migrationUrl = process.env["DATABASE_MIGRATION_URL"] ?? fromFile["DATABASE_MIGRATION_URL"];
if (!migrationUrl) {
  console.error(`DATABASE_MIGRATION_URL is not set (environment or ${envPath}).`);
  process.exit(1);
}

// Re-use the pnpm that launched this script (it isn't necessarily on PATH).
const pnpm = process.env["npm_execpath"];
const [command, args] =
  pnpm && /\.c?js$/.test(pnpm) ? [process.execPath, [pnpm, ...migrateArgs]] : ["pnpm", migrateArgs];

const result = spawnSync(command, args, {
  cwd: root,
  stdio: "inherit",
  shell: command === "pnpm" && process.platform === "win32",
  env: { ...process.env, DATABASE_URL: migrationUrl },
});
process.exit(result.status ?? 1);
