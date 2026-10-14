/**
 * crm module business logic. Route handlers call these; they never write
 * SQL directly (docs/architecture/MODULE_ARCHITECTURE.md - the crm
 * module owns its own tables, nothing outside this module touches
 * `leads` directly). Client creation on conversion calls into the
 * clients module's own exported function rather than writing to
 * `clients` directly - same module-boundary rule.
 */
import type { Kysely } from "kysely";
import type { Database, LeadStatus, LeadChannel } from "../../lib/db.js";
import { AppError } from "../../lib/errors.js";
import { logAccess } from "../../lib/audit.js";
import { createClient } from "../clients/service.js";
import type { ContactInput, ManualLeadInput, ConvertLeadInput } from "./schema.js";

export async function createLeadFromWebsite(
  db: Kysely<Database>,
  input: ContactInput,
): Promise<void> {
  await db
    .insertInto("leads")
    .values({
      name: input.name,
      contact: input.contact,
      stated_need: input.statedNeed ?? null,
      channel: "website",
      status: "new",
    })
    .execute();
}

export async function createLeadManual(
  db: Kysely<Database>,
  input: ManualLeadInput,
): Promise<void> {
  await db
    .insertInto("leads")
    .values({
      name: input.name,
      contact: input.contact,
      stated_need: input.statedNeed ?? null,
      channel: input.channel,
      status: "new",
    })
    .execute();
}

export interface LeadListItem {
  id: string;
  name: string;
  contact: string;
  channel: LeadChannel;
  statedNeed: string | null;
  status: LeadStatus;
  createdAt: Date;
  convertedClientId: string | null;
}

export async function listLeads(
  db: Kysely<Database>,
  filter: { status?: LeadStatus | undefined; channel?: LeadChannel | undefined },
): Promise<LeadListItem[]> {
  let query = db.selectFrom("leads").selectAll().orderBy("created_at", "desc");
  if (filter.status) {
    query = query.where("status", "=", filter.status);
  }
  if (filter.channel) {
    query = query.where("channel", "=", filter.channel);
  }
  const rows = await query.execute();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    contact: row.contact,
    channel: row.channel,
    statedNeed: row.stated_need,
    status: row.status,
    createdAt: row.created_at,
    convertedClientId: row.converted_client_id,
  }));
}

export async function convertLead(
  db: Kysely<Database>,
  leadId: string,
  staffUserId: string,
  clientInput: ConvertLeadInput,
): Promise<{ clientId: string; leadId: string }> {
  return db.transaction().execute(async (trx) => {
    const lead = await trx
      .selectFrom("leads")
      .select(["id", "status"])
      .where("id", "=", leadId)
      .executeTakeFirst();

    if (!lead) {
      throw new AppError("NOT_FOUND", "Lead not found.");
    }
    // ERROR_HANDLING.md's own worked example for CONFLICT/409 is
    // exactly this case - "converting an already-converted lead" -
    // taken as the more specific, deliberate answer over
    // API_CONVENTIONS.md's earlier, more general "400" note for the
    // same scenario.
    if (lead.status === "converted") {
      throw new AppError("CONFLICT", "This lead has already been converted.");
    }

    const client = await createClient(trx, clientInput);

    await trx
      .updateTable("leads")
      .set({
        status: "converted",
        converted_client_id: client.id,
        converted_at: new Date(),
        converted_by: staffUserId,
      })
      .where("id", "=", leadId)
      .execute();

    // Same transaction as the writes above - an un-audited
    // compliance-critical write is a full failure, not a best-effort
    // afterthought (docs/architecture/DATA_ARCHITECTURE.md).
    await logAccess(trx, {
      userId: staffUserId,
      action: "lead_converted",
      resourceType: "client",
      resourceId: client.id,
    });

    return { clientId: client.id, leadId };
  });
}
