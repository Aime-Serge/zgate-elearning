import type { ComplianceItemType } from "./compliance";

export type ClientStatus = "on_track" | "attention_needed" | "no_items";

export interface ClientListItem {
  id: string;
  legalName: string;
  nextItemType: ComplianceItemType | null;
  nextDueDate: string | null;
  status: ClientStatus;
}

export const clientStatusLabels: Record<ClientStatus, string> = {
  on_track: "On track",
  attention_needed: "Attention needed",
  no_items: "No items due",
};

export interface ClientDetail {
  id: string;
  legalName: string;
  tin: string | null;
  registeredAddress: string | null;
  primaryContactName: string | null;
  primaryContactChannel: string | null;
  engagementIds: string[];
}
