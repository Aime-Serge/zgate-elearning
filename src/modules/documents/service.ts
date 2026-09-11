/**
 * documents module business logic - the only module that touches
 * deliverables (docs/architecture/MODULE_ARCHITECTURE.md). Read-only at
 * this phase: this is the client-portal deliverables list and download
 * (FEAT-05.2). Uploading a deliverable (FEAT-06.3) is staff-side
 * Advisory Operations work, not yet built - this module's tests create
 * fixtures with a direct database write plus a direct call to
 * lib/storage.ts, the same pattern already established for every other
 * DB-seeded test in this codebase.
 */
import type { Kysely } from "kysely";
import type { Database, DeliverableType } from "../../lib/db.js";
import { AppError } from "../../lib/errors.js";

export interface DeliverableView {
  id: string;
  type: DeliverableType;
  uploadedAt: string;
}

export async function listDeliverablesForClient(
  db: Kysely<Database>,
  clientId: string,
): Promise<DeliverableView[]> {
  const rows = await db
    .selectFrom("deliverables")
    .innerJoin("engagements", "engagements.id", "deliverables.engagement_id")
    .where("engagements.client_id", "=", clientId)
    .select(["deliverables.id", "deliverables.type", "deliverables.uploaded_at"])
    .orderBy("deliverables.uploaded_at", "desc")
    .execute();

  // fileRef is deliberately never included - it's an internal storage
  // pointer, never sent to any client (docs/backend/API_CONVENTIONS.md).
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    uploadedAt: row.uploaded_at.toISOString(),
  }));
}

export interface DeliverableForDownload {
  id: string;
  type: DeliverableType;
  fileRef: string;
  ownerClientId: string;
}

export async function getDeliverableForDownload(
  db: Kysely<Database>,
  deliverableId: string,
): Promise<DeliverableForDownload> {
  const row = await db
    .selectFrom("deliverables")
    .innerJoin("engagements", "engagements.id", "deliverables.engagement_id")
    .where("deliverables.id", "=", deliverableId)
    .select([
      "deliverables.id",
      "deliverables.type",
      "deliverables.file_ref",
      "engagements.client_id",
    ])
    .executeTakeFirst();

  if (!row) {
    throw new AppError("NOT_FOUND", "Not found.");
  }

  return { id: row.id, type: row.type, fileRef: row.file_ref, ownerClientId: row.client_id };
}
