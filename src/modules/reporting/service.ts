/**
 * reporting module business logic - deliberately the one module that
 * reads across other modules' tables (clients/engagements/
 * compliance_items, leads) without writing to any of them
 * (docs/architecture/DOMAIN_ARCHITECTURE.md §7: "computed live, on
 * request - no scheduled aggregation job, because there's no stored
 * aggregate to refresh"). Read-only aggregation is what a reporting
 * module exists to do; MODULE_ARCHITECTURE.md's "one module owns each
 * table" rule is about write ownership, which this module never
 * exercises.
 */
import type { Kysely } from "kysely";
import type { Database } from "../../lib/db.js";

export interface AdvisorySummary {
  activeClientCount: number;
  /** null when there's no completed item yet to compute a rate from -
   * an honest "no data", not a misleading 0% or 100%
   * (docs/design/COMPONENT_SPECIFICATION.md's Dashboards states). */
  onTimeRate: number | null;
}

export async function getAdvisorySummary(db: Kysely<Database>): Promise<AdvisorySummary> {
  const activeClients = await db
    .selectFrom("engagements")
    .where("status", "=", "active")
    .select((eb) => eb.fn.count<string>("client_id").distinct().as("count"))
    .executeTakeFirst();

  const completedItems = await db
    .selectFrom("compliance_items")
    .where("completed_at", "is not", null)
    .select(["due_date", "completed_at"])
    .execute();

  let onTimeRate: number | null = null;
  if (completedItems.length > 0) {
    const onTimeCount = completedItems.filter((item) => {
      // "On time" = completed by the end of its due date's calendar
      // day - the start of the following day is the cutoff, avoiding
      // any time-of-day comparison against a date-only column.
      const dayAfterDue = new Date(item.due_date);
      dayAfterDue.setDate(dayAfterDue.getDate() + 1);
      return item.completed_at !== null && item.completed_at < dayAfterDue;
    }).length;
    onTimeRate = Math.round((onTimeCount / completedItems.length) * 100);
  }

  return {
    activeClientCount: Number(activeClients?.count ?? 0),
    onTimeRate,
  };
}

export interface LeadPipeline {
  byStatus: Record<string, number>;
  byChannel: Record<string, number>;
}

export async function getLeadPipeline(db: Kysely<Database>): Promise<LeadPipeline> {
  const statusRows = await db
    .selectFrom("leads")
    .select(["status"])
    .select((eb) => eb.fn.countAll<string>().as("count"))
    .groupBy("status")
    .execute();

  const channelRows = await db
    .selectFrom("leads")
    .select(["channel"])
    .select((eb) => eb.fn.countAll<string>().as("count"))
    .groupBy("channel")
    .execute();

  const byStatus: Record<string, number> = {};
  for (const row of statusRows) {
    byStatus[row.status] = Number(row.count);
  }

  const byChannel: Record<string, number> = {};
  for (const row of channelRows) {
    byChannel[row.channel] = Number(row.count);
  }

  return { byStatus, byChannel };
}

/**
 * Column names already established elsewhere in this codebase as
 * holding a secret or a Confidential-classified identifier - never a
 * column's actual value, only that the column itself needs the same
 * handling docs/database/DATA_SECURITY.md already requires (never
 * logged, never returned to a caller who doesn't need it). This list is
 * intentionally small and specific rather than a pattern-matching
 * heuristic that could either over- or under-flag a real column.
 */
const SENSITIVE_COLUMNS = new Set(["password_hash", "token_hash", "tin", "file_ref", "score"]);

export interface DataDictionaryColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  sensitive: boolean;
}

export interface DataDictionaryTable {
  name: string;
  columns: DataDictionaryColumn[];
}

/**
 * Introspects the live database rather than hand-maintaining a second,
 * driftable copy of docs/database/DATA_MODEL.md - this is always
 * exactly what's actually deployed, which is the "lineage" and
 * "accuracy" guarantee a hand-written dictionary can't make for itself.
 */
export async function getDataDictionary(db: Kysely<Database>): Promise<DataDictionaryTable[]> {
  const tables = await db.introspection.getTables();
  return tables
    .filter((table) => !table.isView)
    .map((table) => ({
      name: table.name,
      columns: table.columns.map((column) => ({
        name: column.name,
        dataType: column.dataType,
        nullable: column.isNullable,
        sensitive: SENSITIVE_COLUMNS.has(column.name),
      })),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface DataQualitySummary {
  generatedAt: string;
  leads: { staleNewCount: number };
  clients: { withoutEngagementCount: number };
  complianceItems: { overdueCount: number };
  academyEnrollments: { stalePendingCount: number };
}

const STALE_LEAD_DAYS = 14;
const STALE_ENROLLMENT_DAYS = 7;

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Completeness/timeliness signals computed live over the existing
 * operational tables - no stored aggregate, no separate quality-check
 * table (docs/architecture/DOMAIN_ARCHITECTURE.md §7's "queries over
 * other modules' data, not a separate domain"). "Consistency" (no
 * orphaned foreign keys) is guaranteed structurally by the database's
 * own FK constraints, not something this function needs to re-check.
 * Counts only - never a row-level record - so this stays safe to expose
 * at the same aggregate-read sensitivity as the rest of this module.
 */
export async function getDataQualitySummary(db: Kysely<Database>): Promise<DataQualitySummary> {
  const staleNewLeads = await db
    .selectFrom("leads")
    .where("status", "=", "new")
    .where("created_at", "<", daysAgo(STALE_LEAD_DAYS))
    .select((eb) => eb.fn.countAll<string>().as("count"))
    .executeTakeFirst();

  const clientsWithoutEngagement = await db
    .selectFrom("clients")
    .leftJoin("engagements", "engagements.client_id", "clients.id")
    .where("clients.deleted_at", "is", null)
    .where("engagements.id", "is", null)
    .select((eb) => eb.fn.count<string>("clients.id").distinct().as("count"))
    .executeTakeFirst();

  const overdueComplianceItems = await db
    .selectFrom("compliance_items")
    .where("completed_at", "is", null)
    .where("due_date", "<", new Date())
    .select((eb) => eb.fn.countAll<string>().as("count"))
    .executeTakeFirst();

  const stalePendingEnrollments = await db
    .selectFrom("enrollments")
    .where("status", "=", "pending")
    .where("enrolled_at", "<", daysAgo(STALE_ENROLLMENT_DAYS))
    .select((eb) => eb.fn.countAll<string>().as("count"))
    .executeTakeFirst();

  return {
    generatedAt: new Date().toISOString(),
    leads: { staleNewCount: Number(staleNewLeads?.count ?? 0) },
    clients: { withoutEngagementCount: Number(clientsWithoutEngagement?.count ?? 0) },
    complianceItems: { overdueCount: Number(overdueComplianceItems?.count ?? 0) },
    academyEnrollments: { stalePendingCount: Number(stalePendingEnrollments?.count ?? 0) },
  };
}
