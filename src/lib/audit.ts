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
