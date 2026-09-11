/**
 * Liveness vs. readiness, kept as two distinct checks
 * (docs/devops/PRODUCTION_ARCHITECTURE.md's health-check contract) -
 * a load balancer/orchestrator uses liveness to decide "should this
 * process be restarted" and readiness to decide "should traffic be
 * routed here right now." Conflating them means a slow/unreachable
 * database looks identical to a genuinely crashed process, which is
 * exactly the distinction a rollback/restart decision needs.
 */
import { sql, type Kysely } from "kysely";
import type { Database } from "./lib/db.js";

export interface HealthStatus {
  status: "ok";
  checkedAt: string;
}

/**
 * Liveness: is the process itself up and able to respond. Deliberately
 * has no dependency on the database or any other external system - a
 * database outage should surface as a readiness failure, not make the
 * process look dead and get killed/restarted for no reason.
 */
export function getHealthStatus(now: Date = new Date()): HealthStatus {
  return {
    status: "ok",
    checkedAt: now.toISOString(),
  };
}

export interface ReadinessStatus {
  status: "ready" | "not_ready";
  checks: {
    database: "ok" | "error";
  };
}

/**
 * Readiness: can this instance actually serve a request right now.
 * `select 1` is the standard minimal connectivity probe - cheap enough
 * to run on every readiness check, and it exercises the real connection
 * pool (lib/db.ts), not a separate, unrepresentative code path.
 *
 * Takes a lazy accessor, not an already-constructed Kysely instance, so
 * a synchronous config failure (e.g. DATABASE_URL unset - lib/config.ts's
 * getDatabaseUrl() throws) is caught as a readiness failure too, not an
 * unhandled 500 that bypasses the 503 contract this endpoint exists to
 * provide.
 */
export async function getReadinessStatus(getDbInstance: () => Kysely<Database>): Promise<ReadinessStatus> {
  try {
    const db = getDbInstance();
    await sql`select 1`.execute(db);
    return { status: "ready", checks: { database: "ok" } };
  } catch {
    return { status: "not_ready", checks: { database: "error" } };
  }
}
