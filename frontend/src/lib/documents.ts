export type DeliverableType = "report" | "filing_copy" | "other";

export interface Deliverable {
  id: string;
  type: DeliverableType;
  uploadedAt: string;
}

/** Mirrors src/db/migrations/006_deliverables.sql's deliverable_type values. */
export const deliverableTypeLabels: Record<DeliverableType, string> = {
  report: "Report",
  filing_copy: "Filing copy",
  other: "Document",
};

export function formatUploadedDate(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
