/**
 * Single source of truth for environment configuration. Replaces
 * scattered `process.env["X"]` reads across app.ts/server.ts/db.ts with
 * one validated, typed source - docs/backend/BACKEND_ARCHITECTURE.md
 * calls out "configuration" as its own foundational capability.
 *
 * Two tiers, deliberately:
 *  - `config` below is validated eagerly, at import time, and always
 *    has safe defaults - importing this module never throws.
 *  - `getDatabaseUrl()` is validated lazily, only when actually called
 *    (db.ts, on first real connection attempt). DATABASE_URL has no
 *    sensible default (a wrong guess would silently point at the wrong
 *    database), and eagerly requiring it here would break every test
 *    that doesn't touch the database - docs/backend/BACKEND_TESTING.md's
 *    "skips DB-dependent tests cleanly without DATABASE_URL" design
 *    depends on this staying lazy.
 */
import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  // The frontend's origin for CORS (docs/backend/API_SECURITY.md - never
  // a wildcard). Defaults to the frontend's documented dev port.
  WEB_ORIGIN: z.string().min(1).default("http://localhost:3001"),
});

export type Config = z.infer<typeof envSchema>;

/**
 * Exported (not just the computed singleton below) so tests can validate
 * parsing/default/error behavior against an arbitrary env object, without
 * mutating the real process.env or resetting modules.
 */
export function parseConfig(env: NodeJS.ProcessEnv): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    // Fails fast, at startup, with a clear message - not a generic
    // crash deep in a request handler. Never echoes env var *values*
    // here, only which names were invalid (docs/backend/API_SECURITY.md
    // - secrets never appear in logs or error output).
    const invalidKeys = result.error.issues.map((issue) => issue.path.join("."));
    throw new Error(`Invalid environment configuration for: ${invalidKeys.join(", ")}`);
  }
  return result.data;
}

export const config = parseConfig(process.env);

export function getDatabaseUrl(): string {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill in a real value.");
  }
  return url;
}
