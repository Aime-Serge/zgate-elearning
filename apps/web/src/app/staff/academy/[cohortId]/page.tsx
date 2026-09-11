"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/useSession";
import { apiFetch, API_URL, ApiError } from "@/lib/api";
import type { Cohort, RosterEntry } from "@/lib/academy";
import { StaffPortalLayout } from "@/components/StaffPortalLayout";
import { Alert } from "@/components/Alert";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/Button";
import styles from "./page.module.css";

const CAN_VIEW = ["staff_academy", "admin"];

export default function StaffCohortRosterPage() {
  const params = useParams<{ cohortId: string }>();
  const cohortId = params.cohortId;
  const router = useRouter();
  const session = useSession();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const enabled = session.isSuccess && !!session.data && CAN_VIEW.includes(session.data.role);

  const cohortsQuery = useQuery<{ cohorts: Cohort[] }>({
    queryKey: ["staff-cohorts"],
    queryFn: () => apiFetch("/api/academy/cohorts"),
    enabled,
  });
  const cohort = cohortsQuery.data?.cohorts.find((c) => c.id === cohortId);

  const rosterQuery = useQuery<{ roster: RosterEntry[] }>({
    queryKey: ["cohort-roster", cohortId],
    queryFn: () => apiFetch(`/api/academy/cohorts/${cohortId}/roster`),
    enabled,
  });

  function invalidateRoster() {
    return queryClient.invalidateQueries({ queryKey: ["cohort-roster", cohortId] });
  }

  function handleError(error: unknown) {
    setActionError(
      error instanceof ApiError
        ? error.message
        : "Couldn't reach the server. Check your connection and try again.",
    );
  }

  const confirmMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      apiFetch(`/api/academy/enrollments/${enrollmentId}/confirm`, { method: "POST" }),
    onSuccess: async () => {
      setActionError(null);
      await invalidateRoster();
    },
    onError: handleError,
  });

  const attendanceMutation = useMutation({
    mutationFn: (input: { enrollmentId: string; sessionNumber: number; present: boolean }) =>
      apiFetch("/api/academy/attendance", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: async () => {
      setActionError(null);
      await invalidateRoster();
    },
    onError: handleError,
  });

  const assessMutation = useMutation({
    mutationFn: (input: { enrollmentId: string; passed: boolean; score?: number }) =>
      apiFetch("/api/academy/assessments", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: async () => {
      setActionError(null);
      await invalidateRoster();
    },
    onError: handleError,
  });

  const certificateMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      apiFetch<{ id: string }>("/api/academy/certificates", {
        method: "POST",
        body: JSON.stringify({ enrollmentId }),
      }),
    onSuccess: async () => {
      setActionError(null);
      await invalidateRoster();
    },
    onError: handleError,
  });

  if (session.isLoading) {
    return (
      <section className="max">
        <p>Loading…</p>
      </section>
    );
  }
  if (!session.data) {
    router.replace("/login");
    return null;
  }
  if (!CAN_VIEW.includes(session.data.role)) {
    return (
      <section className="max">
        <p role="alert">You don&rsquo;t have access to this page.</p>
      </section>
    );
  }

  return (
    <StaffPortalLayout role={session.data.role}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {cohort ? `${cohort.courseName} — ${cohort.label}` : "Cohort"}
        </h1>
      </header>

      {actionError ? (
        <div className={styles.actionError} role="alert">
          {actionError}
        </div>
      ) : null}

      {rosterQuery.isLoading ? (
        <div aria-busy="true" className={styles.skeletonList}>
          <Skeleton className={styles.skeletonRow} />
          <Skeleton className={styles.skeletonRow} />
        </div>
      ) : null}

      {rosterQuery.isError ? <Alert variant="error">We couldn&rsquo;t load the roster.</Alert> : null}

      {rosterQuery.data && rosterQuery.data.roster.length === 0 ? (
        <Alert variant="info">No learners enrolled in this cohort yet.</Alert>
      ) : null}

      {rosterQuery.data
        ? rosterQuery.data.roster.map((entry) => {
            const nextSession = entry.attendance.length + 1;
            return (
              <div key={entry.enrollmentId} className={styles.learnerCard}>
                <div className={styles.learnerHeader}>
                  <div>
                    <p className={styles.learnerName}>{entry.learnerName}</p>
                    <p className={styles.learnerContact}>{entry.learnerContact}</p>
                  </div>
                  <span className={`${styles.badge} ${styles[entry.status]}`}>{entry.status}</span>
                </div>

                {entry.status === "pending" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    loading={confirmMutation.isPending}
                    onClick={() => confirmMutation.mutate(entry.enrollmentId)}
                  >
                    Confirm enrollment
                  </Button>
                ) : null}

                <div className={styles.attendanceRow}>
                  <span className={styles.miniLabel}>
                    Attendance: {entry.attendance.filter((a) => a.present).length}/
                    {entry.attendance.length} sessions marked present
                  </span>
                  <div className={styles.attendanceActions}>
                    <Button
                      type="button"
                      variant="secondary"
                      loading={attendanceMutation.isPending}
                      onClick={() =>
                        attendanceMutation.mutate({
                          enrollmentId: entry.enrollmentId,
                          sessionNumber: nextSession,
                          present: true,
                        })
                      }
                    >
                      Mark session {nextSession} present
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      loading={attendanceMutation.isPending}
                      onClick={() =>
                        attendanceMutation.mutate({
                          enrollmentId: entry.enrollmentId,
                          sessionNumber: nextSession,
                          present: false,
                        })
                      }
                    >
                      Mark session {nextSession} absent
                    </Button>
                  </div>
                </div>

                {!entry.assessment ? (
                  <div className={styles.assessmentActions}>
                    <span className={styles.miniLabel}>Assessment</span>
                    <Button
                      type="button"
                      variant="secondary"
                      loading={assessMutation.isPending}
                      onClick={() => assessMutation.mutate({ enrollmentId: entry.enrollmentId, passed: true })}
                    >
                      Record pass
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      loading={assessMutation.isPending}
                      onClick={() => assessMutation.mutate({ enrollmentId: entry.enrollmentId, passed: false })}
                    >
                      Record fail
                    </Button>
                  </div>
                ) : (
                  <p className={styles.miniLabel}>
                    Assessment: {entry.assessment.passed ? "Passed" : "Not passed"}
                    {entry.assessment.score ? ` (${entry.assessment.score})` : ""}
                  </p>
                )}

                {entry.assessment?.passed && !entry.certificateId ? (
                  <Button
                    type="button"
                    loading={certificateMutation.isPending}
                    onClick={() => certificateMutation.mutate(entry.enrollmentId)}
                  >
                    Issue certificate
                  </Button>
                ) : null}

                {entry.certificateId ? (
                  <a
                    className={styles.certLink}
                    href={`${API_URL}/api/academy/certificates/${entry.certificateId}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View certificate
                  </a>
                ) : null}
              </div>
            );
          })
        : null}
    </StaffPortalLayout>
  );
}
