/**
 * advisory module business logic - the only module that touches
 * engagements/compliance_items (docs/architecture/MODULE_ARCHITECTURE.md).
 * Creating engagements/compliance items in the first place (FEAT-06.1's
 * data source) is still not built - there is currently no way to
 * populate this data except a direct database write (used by this
 * module's own tests, the same pattern already established for every
 * other DB-seeded test in this codebase).
 */
import type { Kysely } from "kysely";
import { AppError } from "../../lib/errors.js";
import { logAccess } from "../../lib/audit.js";
import type { Database, ComplianceItemType } from "../../lib/db.js";

export interface ComplianceItemView {
  id: string;
  type: ComplianceItemType;
  dueDate: string;
  completedAt: string | null;
  isOverdue: boolean;
}

/**
 * `due_date` is a SQL `date` (no time-of-day, no timezone) - node-
 * postgres parses it into a Date at local midnight from the raw
 * "YYYY-MM-DD" it received. Calling `.toISOString()` on that would
 * convert to UTC and, for any server timezone with a positive offset,
 * silently roll the calendar date back by one day. Reading the date
 * back out via the same local getters used to build it avoids that
 * round-trip entirely, regardless of what timezone the server runs in.
 */
function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * All compliance items across every engagement belonging to one
 * client - a client has one engagement per division in general, but
 * only Advisory exists as an active module at MVP.
 */
export async function getComplianceItemsForClient(
  db: Kysely<Database>,
  clientId: string,
): Promise<ComplianceItemView[]> {
  const rows = await db
    .selectFrom("compliance_items")
    .innerJoin("engagements", "engagements.id", "compliance_items.engagement_id")
    .where("engagements.client_id", "=", clientId)
    .select([
      "compliance_items.id",
      "compliance_items.type",
      "compliance_items.due_date",
      "compliance_items.completed_at",
    ])
    // Pending items first, soonest-due first (docs/backend/
    // API_CONVENTIONS.md's "sorted by dueDate ascending among pending
    // items") - matches the partial index built for exactly this shape.
    .orderBy((eb) =>
      eb.case().when("compliance_items.completed_at", "is", null).then(0).else(1).end(),
    )
    .orderBy("compliance_items.due_date", "asc")
    .execute();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return rows.map((row) => {
    const dueDate = new Date(row.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return {
      id: row.id,
      type: row.type,
      dueDate: toDateOnlyString(row.due_date),
      completedAt: row.completed_at ? row.completed_at.toISOString() : null,
      // "Overdue" is deliberately not a stored state - computed here at
      // query time (docs/database/DATA_LIFECYCLES.md).
      isOverdue: row.completed_at === null && dueDate < today,
    };
  });
}

/** Used only by the object-level access check before completeComplianceItem runs. */
export async function getComplianceItemOwnerClientId(
  db: Kysely<Database>,
  complianceItemId: string,
): Promise<string | null> {
  const row = await db
    .selectFrom("compliance_items")
    .innerJoin("engagements", "engagements.id", "compliance_items.engagement_id")
    .where("compliance_items.id", "=", complianceItemId)
    .select("engagements.client_id")
    .executeTakeFirst();
  return row?.client_id ?? null;
}

/**
 * FEAT-06.2: marks a compliance item complete. No client-supplied
 * "completed" timestamp is ever accepted - the server sets
 * `completed_at = now()`, closing off a backdated/falsified compliance
 * record (docs/security/SECURITY_REQUIREMENTS.md V11).
 */
export async function completeComplianceItem(
  db: Kysely<Database>,
  complianceItemId: string,
  staffUserId: string,
): Promise<ComplianceItemView> {
  return db.transaction().execute(async (trx) => {
    const item = await trx
      .selectFrom("compliance_items")
      .select(["id", "type", "due_date", "completed_at"])
      .where("id", "=", complianceItemId)
      .executeTakeFirst();

    if (!item) {
      throw new AppError("NOT_FOUND", "Not found.");
    }
    if (item.completed_at) {
      throw new AppError("CONFLICT", "This item has already been marked complete.");
    }

    const completedAt = new Date();
    await trx
      .updateTable("compliance_items")
      .set({ completed_at: completedAt, completed_by: staffUserId })
      .where("id", "=", complianceItemId)
      .execute();

    // Same transaction as the write itself - an un-audited compliance-
    // critical write is a full failure, not a best-effort afterthought
    // (docs/architecture/DATA_ARCHITECTURE.md).
    await logAccess(trx, {
      userId: staffUserId,
      action: "complete_compliance_item",
      resourceType: "compliance_item",
      resourceId: item.id,
    });

    return {
      id: item.id,
      type: item.type,
      dueDate: toDateOnlyString(item.due_date),
      completedAt: completedAt.toISOString(),
      isOverdue: false,
    };
  });
}
