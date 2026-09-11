/**
 * clients module business logic - the only module that touches the
 * clients table (docs/architecture/MODULE_ARCHITECTURE.md).
 */
import type { Kysely, Transaction } from "kysely";
import { AppError } from "../../lib/errors.js";
import type { Database, ComplianceItemType } from "../../lib/db.js";

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

export interface ClientDetailView {
  id: string;
  legalName: string;
  tin: string | null;
  registeredAddress: string | null;
  primaryContactName: string | null;
  primaryContactChannel: string | null;
  /** The client's engagement ids - needed by the staff-facing "mark
   * complete"/upload actions, which operate per-engagement, not
   * per-client (POST /api/documents's already-approved contract
   * requires one). One per division in general; only Advisory is an
   * active module at MVP, so this is a single-item array in practice. */
  engagementIds: string[];
}

/**
 * The staff-facing client detail view (FEAT-06.2/06.3's "client summary
 * header") - unlike the list and unlike the client's own self-service
 * view, this genuinely needs `tin` for compliance work
 * (docs/backend/API_CONVENTIONS.md's general conventions note: "tin
 * appears only in staff-facing detail responses that need it").
 */
export async function getClientDetail(
  db: Kysely<Database>,
  clientId: string,
): Promise<ClientDetailView> {
  const client = await db
    .selectFrom("clients")
    .select([
      "id",
      "legal_name",
      "tin",
      "registered_address",
      "primary_contact_name",
      "primary_contact_channel",
      "deleted_at",
    ])
    .where("id", "=", clientId)
    .executeTakeFirst();

  if (!client || client.deleted_at) {
    throw new AppError("NOT_FOUND", "Not found.");
  }

  const engagements = await db
    .selectFrom("engagements")
    .select("id")
    .where("client_id", "=", clientId)
    .execute();

  return {
    id: client.id,
    engagementIds: engagements.map((e) => e.id),
    legalName: client.legal_name,
    tin: client.tin,
    registeredAddress: client.registered_address,
    primaryContactName: client.primary_contact_name,
    primaryContactChannel: client.primary_contact_channel,
  };
}

export type ClientStatus = "on_track" | "attention_needed" | "no_items";

export interface ClientListItem {
  id: string;
  legalName: string;
  nextItemType: ComplianceItemType | null;
  nextDueDate: string | null;
  status: ClientStatus;
}

function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * The staff-facing client list (FEAT-06.1) - sorted nearest-due-first,
 * always (docs/design/PAGE_SPECIFICATIONS.md: "not user-configurable at
 * MVP scale"). Deliberately excludes tin/registeredAddress/contact
 * details - a summary list doesn't need the most sensitive fields
 * (docs/backend/API_CONVENTIONS.md).
 */
export async function listClients(db: Kysely<Database>): Promise<ClientListItem[]> {
  const rows = await db
    .selectFrom("clients")
    .leftJoin("engagements", "engagements.client_id", "clients.id")
    .leftJoin("compliance_items", (join) =>
      join
        .onRef("compliance_items.engagement_id", "=", "engagements.id")
        .on("compliance_items.completed_at", "is", null),
    )
    .where("clients.deleted_at", "is", null)
    .select([
      "clients.id",
      "clients.legal_name",
      "compliance_items.type",
      "compliance_items.due_date",
    ])
    .execute();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const byClient = new Map<
    string,
    { legalName: string; nextType: ComplianceItemType | null; nextDueDate: Date | null }
  >();

  for (const row of rows) {
    const existing = byClient.get(row.id);
    const current = existing ?? { legalName: row.legal_name, nextType: null, nextDueDate: null };
    if (row.due_date && (!current.nextDueDate || row.due_date < current.nextDueDate)) {
      current.nextType = row.type;
      current.nextDueDate = row.due_date;
    }
    byClient.set(row.id, current);
  }

  return [...byClient.entries()]
    .map(([id, client]) => {
      const status: ClientStatus = !client.nextDueDate
        ? "no_items"
        : client.nextDueDate < today
          ? "attention_needed"
          : "on_track";
      return {
        id,
        legalName: client.legalName,
        nextItemType: client.nextType,
        nextDueDate: client.nextDueDate ? toDateOnlyString(client.nextDueDate) : null,
        status,
      };
    })
    .sort((a, b) => {
      if (!a.nextDueDate) return 1;
      if (!b.nextDueDate) return -1;
      return a.nextDueDate.localeCompare(b.nextDueDate);
    });
}
