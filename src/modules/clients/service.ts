/**
 * clients module business logic - the only module that touches the
 * clients table (docs/architecture/MODULE_ARCHITECTURE.md). Minimal by
 * design: only createClient, the one operation the lead-conversion
 * workflow needs. GET /api/clients (staff list/detail) is a separate,
 * not-yet-built slice - out of scope for this phase's lead-management
 * workflow.
 */
import type { Kysely, Transaction } from "kysely";
import type { Database } from "../../lib/db.js";

export interface CreateClientInput {
  legalName: string;
  tin?: string | undefined;
  registeredAddress?: string | undefined;
  primaryContactName?: string | undefined;
  primaryContactChannel?: string | undefined;
}

export async function createClient(
  db: Kysely<Database> | Transaction<Database>,
  input: CreateClientInput,
): Promise<{ id: string }> {
  return db
    .insertInto("clients")
    .values({
      legal_name: input.legalName,
      tin: input.tin ?? null,
      registered_address: input.registeredAddress ?? null,
      primary_contact_name: input.primaryContactName ?? null,
      primary_contact_channel: input.primaryContactChannel ?? null,
    })
    .returning("id")
    .executeTakeFirstOrThrow();
}
