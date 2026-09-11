export interface AdvisorySummary {
  activeClientCount: number;
  onTimeRate: number | null;
}

export interface LeadPipeline {
  byStatus: Record<string, number>;
  byChannel: Record<string, number>;
}
