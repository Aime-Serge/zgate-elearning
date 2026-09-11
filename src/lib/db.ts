/**
 * Kysely database layer. Types below mirror db/migrations/*.sql exactly -
 * that SQL is the schema's source of truth (docs/database/MIGRATION_STRATEGY.md),
 * this file does not define or migrate schema itself.
 */
import { Kysely, PostgresDialect, type Generated, type ColumnType } from "kysely";
import { Pool } from "pg";
import { getDatabaseUrl } from "./config.js";

export type UserRole = "client" | "staff_advisory" | "staff_marketing" | "staff_academy" | "admin";
export type Division = "advisory" | "academy" | "tech" | "data";
export type LeadChannel = "website" | "whatsapp" | "facebook" | "linkedin" | "other";
export type LeadStatus = "new" | "qualified" | "converted" | "lost";
export type ServiceSchedule = "A" | "B" | "C" | "D";
export type EngagementStatus = "active" | "completed" | "terminated";
export type ComplianceItemType = "close_out" | "vat_ebm_filing" | "annual_return" | "urgent_issue";
export type DeliverableType = "report" | "filing_copy" | "other";
export type CohortStatus = "upcoming" | "active" | "completed";
export type EnrollmentStatus = "pending" | "confirmed" | "withdrawn";

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

export interface PasswordResetTokensTable {
  id: Generated<string>;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Generated<Date>;
}

export interface CoursesTable {
  id: Generated<string>;
  name: string;
  audience: string;
  duration: string;
  fee: string;
  total_sessions: number;
  created_at: Generated<Date>;
}

export interface CohortsTable {
  id: Generated<string>;
  course_id: string;
  trainer_id: string;
  label: string;
  starts_at: Date;
  status: ColumnType<CohortStatus, CohortStatus | undefined, CohortStatus>;
  created_at: Generated<Date>;
}

export interface LearnersTable {
  id: Generated<string>;
  name: string;
  contact: string;
  user_id: string | null;
  created_at: Generated<Date>;
}

export interface EnrollmentsTable {
  id: Generated<string>;
  learner_id: string;
  cohort_id: string;
  status: ColumnType<EnrollmentStatus, EnrollmentStatus | undefined, EnrollmentStatus>;
  enrolled_at: Generated<Date>;
  confirmed_at: Date | null;
  confirmed_by: string | null;
}

export interface AttendanceRecordsTable {
  id: Generated<string>;
  enrollment_id: string;
  session_number: number;
  present: boolean;
  recorded_at: Generated<Date>;
  recorded_by: string;
}

export interface AssessmentsTable {
  id: Generated<string>;
  enrollment_id: string;
  passed: boolean;
  score: string | null;
  assessed_at: Generated<Date>;
  assessed_by: string;
}

export interface CertificatesTable {
  id: Generated<string>;
  enrollment_id: string;
  file_ref: string;
  issued_at: Generated<Date>;
  issued_by: string;
}

export interface Database {
  users: UsersTable;
  clients: ClientsTable;
  leads: LeadsTable;
  engagements: EngagementsTable;
  compliance_items: ComplianceItemsTable;
  deliverables: DeliverablesTable;
  access_log: AccessLogTable;
  password_reset_tokens: PasswordResetTokensTable;
  courses: CoursesTable;
  cohorts: CohortsTable;
  learners: LearnersTable;
  enrollments: EnrollmentsTable;
  attendance_records: AttendanceRecordsTable;
  assessments: AssessmentsTable;
  certificates: CertificatesTable;
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
      pool: new Pool({
        connectionString: getDatabaseUrl(),
        // node-postgres's own default is 0 - wait forever for a
        // connection. Found as a real bug while manually verifying
        // /api/ready (docs/devops/PRODUCTION_ARCHITECTURE.md): against
        // an unreachable database, the request hung indefinitely
        // instead of the fast 503 a readiness probe exists to give.
        // Worse than just that one endpoint - every query anywhere in
        // the app would hang the same way during a real database
        // outage, exactly the moment a fast failure matters most.
        connectionTimeoutMillis: 5000,
      }),
    }),
  });
  return instance;
}
