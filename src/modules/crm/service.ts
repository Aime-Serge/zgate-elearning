/**
 * crm module business logic. Route handlers call these; they never write
 * SQL directly (docs/architecture/MODULE_ARCHITECTURE.md - the crm
 * module owns its own tables, nothing outside this module touches
 * `leads` directly).
 */
import type { Kysely } from "kysely";
import type { Database } from "../../lib/db.js";
import type { ContactInput } from "./schema.js";

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
