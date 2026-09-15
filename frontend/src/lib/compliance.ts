export type ComplianceItemType = "close_out" | "vat_ebm_filing" | "annual_return" | "urgent_issue";

export interface ComplianceItem {
  id: string;
  type: ComplianceItemType;
  dueDate: string;
  completedAt: string | null;
  isOverdue: boolean;
}

/**
 * Plain-language labels (FEAT-05.1: "plain-language explanation," not
 * the raw enum value) - mirrors src/db/migrations/005_compliance_items.sql's
 * compliance_item_type values exactly.
 */
export const complianceItemLabels: Record<ComplianceItemType, string> = {
  close_out: "Monthly close-out",
  vat_ebm_filing: "VAT/EBM filing",
  annual_return: "Annual return",
  urgent_issue: "Urgent issue",
};

export function formatDueDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
