"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";
import type { ClientListItem } from "@/lib/clients";
import { clientStatusLabels } from "@/lib/clients";
import { complianceItemLabels, formatDueDate } from "@/lib/compliance";
import { StaffPortalLayout } from "@/components/StaffPortalLayout";
import { Alert } from "@/components/Alert";
import { Skeleton } from "@/components/Skeleton";
import styles from "./page.module.css";

const CAN_VIEW = ["staff_advisory", "admin"];

export default function StaffClientsPage() {
  const router = useRouter();
  const session = useSession();

  const clientsQuery = useQuery<{ clients: ClientListItem[] }>({
    queryKey: ["staff-clients"],
    queryFn: () => apiFetch("/api/clients"),
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
      <h1 className={styles.title}>Clients</h1>
      <p className={styles.lede}>Sorted by nearest compliance due date.</p>

      {clientsQuery.isLoading ? (
        <div aria-busy="true" className={styles.skeletonList}>
          <Skeleton className={styles.skeletonRow} />
          <Skeleton className={styles.skeletonRow} />
          <Skeleton className={styles.skeletonRow} />
        </div>
      ) : null}

      {clientsQuery.isError ? (
        <div className={styles.errorBlock}>
          <Alert variant="error">We couldn&rsquo;t load the client list right now.</Alert>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => {
              void clientsQuery.refetch();
            }}
          >
            Try again
          </button>
        </div>
      ) : null}

      {clientsQuery.data && clientsQuery.data.clients.length === 0 ? (
        <Alert variant="info">No clients yet — they&rsquo;ll appear here once one is converted.</Alert>
      ) : null}

      {clientsQuery.data && clientsQuery.data.clients.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Client</th>
              <th scope="col">Next due item</th>
              <th scope="col">Due date</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {clientsQuery.data.clients.map((client) => (
              <tr key={client.id}>
                <td data-label="Client">
                  <Link href={`/staff/clients/${client.id}`} className={styles.clientLink}>
                    {client.legalName}
                  </Link>
                </td>
                <td data-label="Next due item">
                  {client.nextItemType ? complianceItemLabels[client.nextItemType] : "—"}
                </td>
                <td data-label="Due date">
                  {client.nextDueDate ? formatDueDate(client.nextDueDate) : "—"}
                </td>
                <td data-label="Status">
                  <span className={`${styles.badge} ${styles[client.status]}`}>
                    {clientStatusLabels[client.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </StaffPortalLayout>
  );
}
