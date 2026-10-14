"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/useSession";
import { apiFetch, API_URL } from "@/lib/api";
import type { Deliverable } from "@/lib/documents";
import { deliverableTypeLabels, formatUploadedDate } from "@/lib/documents";
import { PortalNav } from "@/components/PortalNav";
import { Alert } from "@/components/Alert";
import { Skeleton } from "@/components/Skeleton";
import styles from "./page.module.css";

export default function DeliverablesPage() {
  const router = useRouter();
  const session = useSession();

  const documentsQuery = useQuery<{ documents: Deliverable[] }>({
    queryKey: ["documents"],
    queryFn: () => apiFetch("/api/documents"),
    enabled: session.isSuccess && session.data?.role === "client",
  });

  if (session.isLoading) {
    return (
      <section className={`max ${styles.section}`}>
        <p>Loading…</p>
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
      <h1 className={styles.title}>Deliverables</h1>

      {documentsQuery.isLoading ? (
        <div aria-busy="true" className={styles.skeletonList}>
          <Skeleton className={styles.skeletonRow} />
          <Skeleton className={styles.skeletonRow} />
          <Skeleton className={styles.skeletonRow} />
        </div>
      ) : null}

      {documentsQuery.isError ? (
        <div className={styles.errorBlock}>
          <Alert variant="error">We couldn&rsquo;t load your documents right now.</Alert>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => {
              void documentsQuery.refetch();
            }}
          >
            Try again
          </button>
        </div>
      ) : null}

      {documentsQuery.data && documentsQuery.data.documents.length === 0 ? (
        <Alert variant="info">
          No documents yet — they&rsquo;ll appear here as soon as your Advisory Associate uploads
          one.
        </Alert>
      ) : null}

      {documentsQuery.data && documentsQuery.data.documents.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Type</th>
              <th scope="col">Date</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {documentsQuery.data.documents.map((doc) => {
              const label = deliverableTypeLabels[doc.type];
              const date = formatUploadedDate(doc.uploadedAt);
              return (
                <tr key={doc.id}>
                  <td data-label="Type">{label}</td>
                  <td data-label="Date">{date}</td>
                  <td data-label="Action">
                    <a
                      className={styles.downloadLink}
                      href={`${API_URL}/api/documents/${doc.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Download ${label.toLowerCase()} from ${date}`}
                    >
                      Download
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
