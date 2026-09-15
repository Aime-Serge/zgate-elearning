/**
 * documents module business logic - the only module that touches
 * deliverables (docs/architecture/MODULE_ARCHITECTURE.md).
 */
import type { Kysely } from "kysely";
import type { Database, DeliverableType } from "../../lib/db.js";
import { AppError } from "../../lib/errors.js";
import { logAccess } from "../../lib/audit.js";
import { generateFileRef, writeStoredFile } from "../../lib/storage.js";

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

/** Used only by the upload route's object-level check, to confirm the
 * target engagement exists and to resolve who it belongs to. */
export async function getEngagementClientId(
  db: Kysely<Database>,
  engagementId: string,
): Promise<string | null> {
  const row = await db
    .selectFrom("engagements")
    .select("client_id")
    .where("id", "=", engagementId)
    .executeTakeFirst();
  return row?.client_id ?? null;
}

export interface UploadDeliverableInput {
  engagementId: string;
  type: DeliverableType;
  content: Buffer;
  uploadedBy: string;
}

/**
 * FEAT-06.3: the only place a deliverable is created. The file is
 * written to storage first, then the metadata row - if the metadata
 * write fails, an orphaned file on disk is a harmless, cleanable
 * leftover; the reverse order would risk a DB row pointing at a file
 * that was never actually written.
 */
export async function uploadDeliverable(
  db: Kysely<Database>,
  input: UploadDeliverableInput,
): Promise<DeliverableView> {
  const fileRef = generateFileRef();
  await writeStoredFile(fileRef, input.content);

  return db.transaction().execute(async (trx) => {
    const row = await trx
      .insertInto("deliverables")
      .values({
        engagement_id: input.engagementId,
        type: input.type,
        file_ref: fileRef,
        uploaded_by: input.uploadedBy,
      })
      .returning(["id", "type", "uploaded_at"])
      .executeTakeFirstOrThrow();

    await logAccess(trx, {
      userId: input.uploadedBy,
      action: "upload_deliverable",
      resourceType: "deliverable",
      resourceId: row.id,
    });

    return { id: row.id, type: row.type, uploadedAt: row.uploaded_at.toISOString() };
  });
}
