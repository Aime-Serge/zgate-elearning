"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";
import type { ComplianceItem } from "@/lib/compliance";
import { complianceItemLabels, formatDueDate } from "@/lib/compliance";
import { PortalNav } from "@/components/PortalNav";
import { StatusCard } from "@/components/StatusCard";
import { Alert } from "@/components/Alert";
import { Skeleton } from "@/components/Skeleton";
import styles from "./page.module.css";

export default function PortalStatusPage() {
  const router = useRouter();
  const session = useSession();

  const itemsQuery = useQuery<{ items: ComplianceItem[] }>({
    queryKey: ["compliance-items"],
    queryFn: () => apiFetch("/api/advisory/compliance-items"),
    enabled: session.isSuccess && session.data?.role === "client",
  });

  if (session.isLoading) {
    return (
      <section className={`max ${styles.section}`}>
        <div aria-busy="true" className={styles.skeletonCard}>
          <Skeleton className={styles.skeletonLine} />
          <Skeleton className={styles.skeletonLineShort} />
        </div>
      </section>
    );
  }

  if (!session.data) {
    router.replace("/login");
    return null;
  }

  if (session.data.role !== "client") {
    return (
      <section className={`max ${styles.section}`}>
        <p role="alert">You don&rsquo;t have access to this page.</p>
      </section>
    );
  }

  return (
    <section className={`max ${styles.section}`}>
      <PortalNav />
      <h1 className={styles.title}>Status</h1>

      {itemsQuery.isLoading ? (
        <div aria-busy="true" className={styles.skeletonCard}>
          <Skeleton className={styles.skeletonLine} />
          <Skeleton className={styles.skeletonLineShort} />
        </div>
      ) : null}

      {itemsQuery.isError ? (
        <div className={styles.errorBlock}>
          <Alert variant="error">
            We couldn&rsquo;t load your status right now. Please try again.
          </Alert>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => {
              void itemsQuery.refetch();
            }}
          >
            Try again
          </button>
        </div>
      ) : null}

      {itemsQuery.data ? <StatusView items={itemsQuery.data.items} /> : null}
    </section>
  );
}

function StatusView({ items }: { items: ComplianceItem[] }) {
  const pending = items.filter((item) => item.completedAt === null);

  if (pending.length === 0) {
    return (
      <Alert variant="info">
        No filings due yet — you&rsquo;ll see them here as soon as one is scheduled.
      </Alert>
    );
  }

  const next = pending[0];
  if (!next) {
    return null;
  }
  const label = complianceItemLabels[next.type];
  const dueDate = formatDueDate(next.dueDate);

  if (next.isOverdue) {
    return (
      <StatusCard
        tone="warning"
        sentence={`Your ${label.toLowerCase()} is now overdue. Please reach out to your Advisory Associate.`}
        nextItemLabel={label}
        nextDueDate={dueDate}
      />
    );
  }

  return (
    <StatusCard
      tone="success"
      sentence="You're on track — nothing needs your attention right now."
      nextItemLabel={label}
      nextDueDate={dueDate}
    />
  );
}
