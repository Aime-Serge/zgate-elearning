/**
 * Audit foundation - the one shared way any module records that a human
 * accessed or changed Confidential-classified data
 * (docs/backend/BACKEND_ARCHITECTURE.md: "one function, one call
 * signature, used everywhere, so the log's shape can never drift between
 * modules"). No module writes to access_log with its own hand-rolled
 * SQL.
 *
 * Accepts a plain Kysely instance OR an in-flight Transaction so it can
 * be called inside the same transaction as the write it's auditing -
 * docs/architecture/DATA_ARCHITECTURE.md is explicit that an un-audited
 * compliance-critical write is a full failure, not a best-effort
 * afterthought: if the audit insert fails, the whole transaction (and
 * the business write with it) rolls back.
 */
import type { Kysely, Transaction } from "kysely";
import type { Database } from "./db.js";

export type AuditExecutor = Kysely<Database> | Transaction<Database>;

export interface AuditEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
}

export async function logAccess(db: AuditExecutor, entry: AuditEntry): Promise<void> {
  await db
    .insertInto("access_log")
    .values({
      user_id: entry.userId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
    })
    .execute();
}

/**
 * For logging one audit row per record in a list response (e.g. every
 * client a staff list view returns) - a single multi-row INSERT instead
 * of N sequential awaited round trips, which is what every caller of
 * this used to do before this function existed (found as a real N+1
 * pattern during this engagement's performance review, docs/performance/
 * PERFORMANCE_REPORT.md). A no-op for an empty list, since an empty
 * VALUES clause is invalid SQL.
 */
export async function logAccessMany(db: AuditExecutor, entries: AuditEntry[]): Promise<void> {
  if (entries.length === 0) {
    return;
  }
  await db
    .insertInto("access_log")
    .values(
      entries.map((entry) => ({
        user_id: entry.userId,
        action: entry.action,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
      })),
    )
    .execute();
}
