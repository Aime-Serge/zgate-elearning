"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";
import type { Cohort } from "@/lib/academy";
import { StaffPortalLayout } from "@/components/StaffPortalLayout";
import { Alert } from "@/components/Alert";
import { Skeleton } from "@/components/Skeleton";
import styles from "./page.module.css";

const CAN_VIEW = ["staff_academy", "admin"];

export default function StaffAcademyPage() {
  const router = useRouter();
  const session = useSession();

  const cohortsQuery = useQuery<{ cohorts: Cohort[] }>({
    queryKey: ["staff-cohorts"],
    queryFn: () => apiFetch("/api/academy/cohorts"),
    enabled: session.isSuccess && !!session.data && CAN_VIEW.includes(session.data.role),
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
      <h1 className={styles.title}>Academy cohorts</h1>
      <p className={styles.lede}>Your assigned cohorts.</p>

      {cohortsQuery.isLoading ? (
        <div aria-busy="true" className={styles.skeletonList}>
          <Skeleton className={styles.skeletonRow} />
          <Skeleton className={styles.skeletonRow} />
        </div>
      ) : null}

      {cohortsQuery.isError ? <Alert variant="error">We couldn&rsquo;t load your cohorts.</Alert> : null}

      {cohortsQuery.data && cohortsQuery.data.cohorts.length === 0 ? (
        <Alert variant="info">No cohorts assigned to you yet.</Alert>
      ) : null}

      {cohortsQuery.data && cohortsQuery.data.cohorts.length > 0 ? (
        <ul className={styles.list}>
          {cohortsQuery.data.cohorts.map((cohort) => (
            <li key={cohort.id} className={styles.row}>
              <Link href={`/staff/academy/${cohort.id}`} className={styles.rowLink}>
                <span className={styles.cohortName}>
                  {cohort.courseName} — {cohort.label}
                </span>
                <span className={`${styles.badge} ${styles[cohort.status]}`}>{cohort.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </StaffPortalLayout>
  );
}
