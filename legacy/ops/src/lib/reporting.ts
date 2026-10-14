export interface AdvisorySummary {
  activeClientCount: number;
  onTimeRate: number | null;
}

export interface LeadPipeline {
  byStatus: Record<string, number>;
  byChannel: Record<string, number>;
}

export interface DataQualitySummary {
  generatedAt: string;
  leads: { staleNewCount: number };
  clients: { withoutEngagementCount: number };
  complianceItems: { overdueCount: number };
  academyEnrollments: { stalePendingCount: number };
}

export interface DataDictionaryColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  sensitive: boolean;
}

export interface DataDictionaryTable {
  name: string;
  columns: DataDictionaryColumn[];
}
