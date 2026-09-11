export interface Course {
  id: string;
  name: string;
  audience: string;
  duration: string;
  fee: string;
  totalSessions: number;
}

export type CohortStatus = "upcoming" | "active" | "completed";

export interface Cohort {
  id: string;
  courseId: string;
  courseName: string;
  label: string;
  startsAt: string;
  status: CohortStatus;
}

export interface RosterEntry {
  enrollmentId: string;
  learnerName: string;
  learnerContact: string;
  status: "pending" | "confirmed" | "withdrawn";
  enrolledAt: string;
  confirmedAt: string | null;
  attendance: { sessionNumber: number; present: boolean }[];
  assessment: { passed: boolean; score: string | null } | null;
  certificateId: string | null;
}
