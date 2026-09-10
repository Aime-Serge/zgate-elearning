/**
 * Shared types for the staff lead-management screen - mirrors
 * src/modules/crm/service.ts's LeadListItem exactly, with `createdAt`
 * as a string since that's what crosses the wire as JSON (the backend
 * type is a Date, serialized by Fastify).
 */
export type LeadChannel = "website" | "whatsapp" | "facebook" | "linkedin" | "other";
export type LeadStatus = "new" | "qualified" | "converted" | "lost";

export interface LeadListItem {
  id: string;
  name: string;
  contact: string;
  channel: LeadChannel;
  statedNeed: string | null;
  status: LeadStatus;
  createdAt: string;
  convertedClientId: string | null;
}
