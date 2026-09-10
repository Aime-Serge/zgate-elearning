/**
 * Kysely database layer. Types below mirror db/migrations/*.sql exactly -
 * that SQL is the schema's source of truth (docs/database/MIGRATION_STRATEGY.md),
 * this file does not define or migrate schema itself.
 */
import { Kysely, PostgresDialect, type Generated, type ColumnType } from "kysely";
import { Pool } from "pg";

export type UserRole = "client" | "staff_advisory" | "staff_marketing" | "admin";
export type Division = "advisory" | "academy" | "tech" | "data";
export type LeadChannel = "website" | "whatsapp" | "facebook" | "linkedin" | "other";
export type LeadStatus = "new" | "qualified" | "converted" | "lost";
export type ServiceSchedule = "A" | "B" | "C" | "D";
export type EngagementStatus = "active" | "completed" | "terminated";
export type ComplianceItemType = "close_out" | "vat_ebm_filing" | "annual_return" | "urgent_issue";
export type DeliverableType = "report" | "filing_copy" | "other";

export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  role: UserRole;
  division: Division | null;
  client_id: string | null;
  created_at: Generated<Date>;
  deactivated_at: Date | null;
}

export interface ClientsTable {
  id: Generated<string>;
  legal_name: string;
  tin: string | null;
  registered_address: string | null;
  primary_contact_name: string | null;
  primary_contact_channel: string | null;
  created_at: Generated<Date>;
  deleted_at: Date | null;
}

export interface LeadsTable {
  id: Generated<string>;
  name: string;
  contact: string;
  channel: LeadChannel;
  stated_need: string | null;
  status: ColumnType<LeadStatus, LeadStatus | undefined, LeadStatus>;
  converted_client_id: string | null;
  converted_at: Date | null;
  converted_by: string | null;
  created_at: Generated<Date>;
}

export interface EngagementsTable {
  id: Generated<string>;
  client_id: string;
  division: Division;
  service_schedule: ServiceSchedule;
  status: ColumnType<EngagementStatus, EngagementStatus | undefined, EngagementStatus>;
  started_at: Generated<Date>;
  ended_at: Date | null;
}

export interface ComplianceItemsTable {
  id: Generated<string>;
  engagement_id: string;
  type: ComplianceItemType;
  due_date: Date;
  completed_at: Date | null;
  completed_by: string | null;
  created_at: Generated<Date>;
}

export interface DeliverablesTable {
  id: Generated<string>;
  engagement_id: string;
  type: DeliverableType;
  file_ref: string;
  uploaded_at: Generated<Date>;
  uploaded_by: string;
}

export interface AccessLogTable {
  id: Generated<string>;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  occurred_at: Generated<Date>;
}

export interface Database {
  users: UsersTable;
  clients: ClientsTable;
  leads: LeadsTable;
  engagements: EngagementsTable;
  compliance_items: ComplianceItemsTable;
  deliverables: DeliverablesTable;
  access_log: AccessLogTable;
}

/**
 * Lazily-constructed singleton so importing this module never opens a
 * connection by itself - only actually connecting on first real use, which
 * keeps unit tests that don't touch the database free of any DB dependency.
 */
let instance: Kysely<Database> | undefined;

export function getDb(): Kysely<Database> {
  instance ??= new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: requireDatabaseUrl() }),
    }),
  });
  return instance;
}

function requireDatabaseUrl(): string {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill in a real value.");
  }
  return url;
}
