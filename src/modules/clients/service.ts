/**
 * clients module business logic - the only module that touches the
 * clients table (docs/architecture/MODULE_ARCHITECTURE.md). createClient
 * (lead conversion) and getOwnClient (the client portal's "organization"
 * view, FEAT-05.1's dependency) are both built. GET /api/clients (the
 * staff-facing list, FEAT-06.1) is a separate, not-yet-built slice -
 * that's staff Advisory tooling, out of scope for the client-portal
 * work this module currently serves.
 */
import type { Kysely, Transaction } from "kysely";
import { AppError } from "../../lib/errors.js";
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

export interface OwnClientView {
  id: string;
  legalName: string;
  primaryContactName: string | null;
}

/**
 * The client-portal "organization" view - deliberately excludes `tin`
 * even for the client's own record (API_CONVENTIONS.md's data-
 * minimization note: a client checking their own status doesn't need
 * their TIN echoed back).
 */
export async function getOwnClient(db: Kysely<Database>, clientId: string): Promise<OwnClientView> {
  const client = await db
    .selectFrom("clients")
    .select(["id", "legal_name", "primary_contact_name", "deleted_at"])
    .where("id", "=", clientId)
    .executeTakeFirst();

  if (!client || client.deleted_at) {
    // The client_id on a client-role session always points at a real
    // row by the database's own check constraint - this branch exists
    // for defense in depth, not a reachable normal path.
    throw new AppError("NOT_FOUND", "Not found.");
  }

  return {
    id: client.id,
    legalName: client.legal_name,
    primaryContactName: client.primary_contact_name,
  };
}
