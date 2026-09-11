"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/useSession";
import { apiFetch, API_URL, ApiError } from "@/lib/api";
import type { ClientDetail } from "@/lib/clients";
import type { ComplianceItem } from "@/lib/compliance";
import { complianceItemLabels, formatDueDate } from "@/lib/compliance";
import type { Deliverable } from "@/lib/documents";
import { deliverableTypeLabels, formatUploadedDate } from "@/lib/documents";
import { StaffPortalLayout } from "@/components/StaffPortalLayout";
import { Alert } from "@/components/Alert";
import { Skeleton } from "@/components/Skeleton";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { UploadDeliverableForm } from "@/components/UploadDeliverableForm";
import styles from "./page.module.css";

const CAN_VIEW = ["staff_advisory", "admin"];

export default function StaffClientDetailPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;
  const router = useRouter();
  const session = useSession();
  const queryClient = useQueryClient();
  const [confirmingItemId, setConfirmingItemId] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const enabled = session.isSuccess && !!session.data && CAN_VIEW.includes(session.data.role);

  const clientQuery = useQuery<ClientDetail>({
    queryKey: ["staff-client", clientId],
    queryFn: () => apiFetch(`/api/clients/${clientId}`),
    enabled,
  });

  const itemsQuery = useQuery<{ items: ComplianceItem[] }>({
    queryKey: ["staff-compliance-items", clientId],
    queryFn: () => apiFetch(`/api/advisory/compliance-items?clientId=${clientId}`),
    enabled,
  });

  const documentsQuery = useQuery<{ documents: Deliverable[] }>({
    queryKey: ["staff-documents", clientId],
    queryFn: () => apiFetch(`/api/documents?clientId=${clientId}`),
    enabled,
  });

  const completeMutation = useMutation({
    mutationFn: (itemId: string) =>
      apiFetch(`/api/advisory/compliance-items/${itemId}/complete`, { method: "POST" }),
    onSuccess: async () => {
      setConfirmingItemId(null);
      setCompleteError(null);
      await queryClient.invalidateQueries({ queryKey: ["staff-compliance-items", clientId] });
    },
    onError: (error: unknown) => {
      setCompleteError(
        error instanceof ApiError
          ? error.message
          : "Couldn't reach the server. Check your connection and try again.",
      );
    },
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

  const confirmingItem = itemsQuery.data?.items.find((item) => item.id === confirmingItemId);
  const primaryEngagementId = clientQuery.data?.engagementIds[0];

  return (
    <StaffPortalLayout role={session.data.role}>
      {clientQuery.isLoading ? (
        <div aria-busy="true" className={styles.skeletonHeader}>
          <Skeleton className={styles.skeletonLine} />
        </div>
      ) : null}

      {clientQuery.isError ? <Alert variant="error">We couldn&rsquo;t load this client.</Alert> : null}

      {clientQuery.data ? (
        <header className={styles.header}>
          <h1 className={styles.title}>{clientQuery.data.legalName}</h1>
          {clientQuery.data.primaryContactName ? (
            <p className={styles.contact}>{clientQuery.data.primaryContactName}</p>
          ) : null}
        </header>
      ) : null}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Compliance items</h2>

        {itemsQuery.isLoading ? (
          <div aria-busy="true" className={styles.skeletonList}>
            <Skeleton className={styles.skeletonRow} />
            <Skeleton className={styles.skeletonRow} />
          </div>
        ) : null}

        {itemsQuery.isError ? <Alert variant="error">We couldn&rsquo;t load compliance items.</Alert> : null}

        {itemsQuery.data && itemsQuery.data.items.length === 0 ? (
          <Alert variant="info">No compliance items yet for this client.</Alert>
        ) : null}

        {itemsQuery.data && itemsQuery.data.items.length > 0 ? (
          <ul className={styles.itemList}>
            {itemsQuery.data.items.map((item) => (
              <li key={item.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemType}>{complianceItemLabels[item.type]}</span>
                  <span className={styles.itemDate}>{formatDueDate(item.dueDate)}</span>
                  {item.completedAt ? (
                    <span className={styles.itemDone}>Completed</span>
                  ) : item.isOverdue ? (
                    <span className={styles.itemOverdue}>Overdue</span>
                  ) : null}
                </div>
                {!item.completedAt ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setCompleteError(null);
                      setConfirmingItemId(item.id);
                    }}
                  >
                    Mark complete
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Deliverables</h2>

        {primaryEngagementId ? (
          <UploadDeliverableForm
            engagementId={primaryEngagementId}
            onUploaded={() => {
              void documentsQuery.refetch();
            }}
          />
        ) : null}

        {documentsQuery.isLoading ? (
          <div aria-busy="true" className={styles.skeletonList}>
            <Skeleton className={styles.skeletonRow} />
          </div>
        ) : null}

        {documentsQuery.isError ? <Alert variant="error">We couldn&rsquo;t load documents.</Alert> : null}

        {documentsQuery.data && documentsQuery.data.documents.length === 0 ? (
          <Alert variant="info">No documents uploaded yet.</Alert>
        ) : null}

        {documentsQuery.data && documentsQuery.data.documents.length > 0 ? (
          <ul className={styles.docList}>
            {documentsQuery.data.documents.map((doc) => {
              const label = deliverableTypeLabels[doc.type];
              const date = formatUploadedDate(doc.uploadedAt);
              return (
                <li key={doc.id} className={styles.docItem}>
                  <span>{label}</span>
                  <span className={styles.docDate}>{date}</span>
                  <a
                    className={styles.downloadLink}
                    href={`${API_URL}/api/documents/${doc.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Download ${label.toLowerCase()} from ${date}`}
                  >
                    Download
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <Modal
        open={confirmingItem !== undefined}
        title="Mark this item complete?"
        onClose={() => setConfirmingItemId(null)}
      >
        {confirmingItem ? (
          <>
            <p>
              {complianceItemLabels[confirmingItem.type]}, due{" "}
              {formatDueDate(confirmingItem.dueDate)}. This can&rsquo;t be undone.
            </p>
            {completeError ? (
              <div className={styles.modalError} role="alert">
                {completeError}
              </div>
            ) : null}
            <div className={styles.modalActions}>
              <Button
                type="button"
                loading={completeMutation.isPending}
                onClick={() => {
                  if (confirmingItemId) completeMutation.mutate(confirmingItemId);
                }}
              >
                Confirm complete
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirmingItemId(null)}>
                Cancel
              </Button>
            </div>
          </>
        ) : null}
      </Modal>
    </StaffPortalLayout>
  );
}
