/**
 * advisory module business logic - the only module that touches
 * engagements/compliance_items (docs/architecture/MODULE_ARCHITECTURE.md).
 * Read-only at this phase: this is the client-portal status view
 * (FEAT-05.1). Marking an item complete (FEAT-06.2) and creating
 * engagements/compliance items in the first place (FEAT-06.1) are
 * staff-side Advisory Operations work, not yet built - there is
 * currently no way to populate this data except a direct database
 * write (used by this module's own tests, the same pattern already
 * established for every other DB-seeded test in this codebase).
 */
import type { Kysely } from "kysely";
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
