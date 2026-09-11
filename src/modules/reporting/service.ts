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
