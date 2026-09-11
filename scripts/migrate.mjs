#!/usr/bin/env node
/**
 * Applies db/migrations/*.sql to whatever DATABASE_URL points at,
 * tracking what's already been applied - docs/database/MIGRATION_STRATEGY.md
 * defines the plain-forward-only-SQL format and explicitly deferred "how
 * these files are actually run in practice" to whenever a backend
 * framework existed to decide it. That's now (docs/devops/
 * PRODUCTION_ARCHITECTURE.md) - staging and production have persistent
 * databases across deploys, so re-running every file unconditionally
 * (CI's current ephemeral-container approach, `.github/workflows/ci.yml`)
 * would fail the second time a CREATE TABLE migration is applied. This
 * closes that gap with the smallest mechanism that does the job: one
 * tracking table, one script, no new framework or dependency.
 *
 * Plain Node, not TypeScript - runs identically in CI, staging, and
 * production without needing a build step or tsx/ts-node available at
 * deploy time, and matches migrations' own "plain SQL, not a framework
 * DSL" reasoning.
 *
 * Usage: DATABASE_URL=postgres://... node scripts/migrate.mjs
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");

async function main() {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Refusing to guess which database to migrate.");
    process.exitCode = 1;
    return;
  }

  const files = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    // One tracking table, created if this is the first run against this
    // database. Filename is the primary key - the same one-logical-
    // change-per-file, sequentially-numbered convention MIGRATION_STRATEGY.md
    // already requires is exactly what makes "has this file run yet" a
    // well-defined question.
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await client.query("SELECT filename FROM schema_migrations");
    const applied = new Set(rows.map((row) => row.filename));

    const pending = files.filter((file) => !applied.has(file));
    if (pending.length === 0) {
      console.log(`Up to date - all ${files.length} migration(s) already applied.`);
      return;
    }

    for (const file of pending) {
      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      console.log(`Applying ${file} ...`);
      // Each migration in its own transaction - matches
      // MIGRATION_STRATEGY.md's "one logical change per migration file";
      // a failure partway through one file rolls back cleanly without
      // touching files already recorded as applied.
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${file} failed - rolled back, no later file applied: ${String(error)}`);
      }
    }

    console.log(`Applied ${pending.length} migration(s). Now at ${files.length} total.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
