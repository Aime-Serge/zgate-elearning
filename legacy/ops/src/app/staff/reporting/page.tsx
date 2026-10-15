"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";
import type {
  AdvisorySummary,
  LeadPipeline,
  DataQualitySummary,
  DataDictionaryTable,
} from "@/lib/reporting";
import { StaffPortalLayout } from "@/components/StaffPortalLayout";
import { Alert } from "@/components/Alert";
import { Skeleton } from "@/components/Skeleton";
import styles from "./page.module.css";

const ADVISORY_ROLES = ["staff_advisory", "admin"];
const MARKETING_ROLES = ["staff_marketing", "admin"];
const DATA_ROLES = ["admin"];

export default function StaffReportingPage() {
  const router = useRouter();
  const session = useSession();
  const role = session.data?.role;

  const canSeeAdvisory = !!role && ADVISORY_ROLES.includes(role);
  const canSeeMarketing = !!role && MARKETING_ROLES.includes(role);
  const canSeeData = !!role && DATA_ROLES.includes(role);

  const summaryQuery = useQuery<AdvisorySummary>({
    queryKey: ["advisory-summary"],
    queryFn: () => apiFetch("/api/reporting/advisory-summary"),
    enabled: session.isSuccess && canSeeAdvisory,
  });

  const pipelineQuery = useQuery<LeadPipeline>({
    queryKey: ["lead-pipeline"],
    queryFn: () => apiFetch("/api/reporting/lead-pipeline"),
    enabled: session.isSuccess && canSeeMarketing,
  });

  const qualityQuery = useQuery<DataQualitySummary>({
    queryKey: ["data-quality"],
    queryFn: () => apiFetch("/api/reporting/data-quality"),
    enabled: session.isSuccess && canSeeData,
  });

  const dictionaryQuery = useQuery<{ tables: DataDictionaryTable[] }>({
    queryKey: ["data-dictionary"],
    queryFn: () => apiFetch("/api/reporting/data-dictionary"),
    enabled: session.isSuccess && canSeeData,
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

  if (!canSeeAdvisory && !canSeeMarketing) {
    return (
      <section className="max">
        <p role="alert">You don&rsquo;t have access to this page.</p>
      </section>
    );
  }

  const leadCount = pipelineQuery.data
    ? Object.values(pipelineQuery.data.byStatus).reduce((sum, n) => sum + n, 0)
    : null;
  const convertedCount = pipelineQuery.data?.byStatus["converted"] ?? 0;
  const conversionRate =
    leadCount && leadCount > 0 ? Math.round((convertedCount / leadCount) * 100) : null;

  const channelEntries = pipelineQuery.data ? Object.entries(pipelineQuery.data.byChannel) : [];
  const maxChannelCount = Math.max(1, ...channelEntries.map(([, count]) => count));

  return (
    <StaffPortalLayout role={session.data.role}>
      <h1 className={styles.title}>Reporting</h1>

      <div className={styles.statGrid}>
        {canSeeAdvisory ? (
          <>
            {summaryQuery.isLoading ? (
              <>
                <Skeleton className={styles.statSkeleton} />
                <Skeleton className={styles.statSkeleton} />
              </>
            ) : null}
            {summaryQuery.isError ? (
              <Alert variant="error">Couldn&rsquo;t load Advisory numbers.</Alert>
            ) : null}
            {summaryQuery.data ? (
              <>
                <StatCard
                  label="Active clients"
                  value={String(summaryQuery.data.activeClientCount)}
                />
                <StatCard
                  label="On-time filing rate"
                  value={
                    summaryQuery.data.onTimeRate === null
                      ? "No data yet"
                      : `${summaryQuery.data.onTimeRate}%`
                  }
                />
              </>
            ) : null}
          </>
        ) : null}

        {canSeeMarketing ? (
          <>
            {pipelineQuery.isLoading ? (
              <>
                <Skeleton className={styles.statSkeleton} />
                <Skeleton className={styles.statSkeleton} />
              </>
            ) : null}
            {pipelineQuery.isError ? (
              <Alert variant="error">Couldn&rsquo;t load lead numbers.</Alert>
            ) : null}
            {pipelineQuery.data ? (
              <>
                <StatCard label="Leads" value={String(leadCount ?? 0)} />
                <StatCard
                  label="Conversion rate"
                  value={conversionRate === null ? "No data yet" : `${conversionRate}%`}
                />
              </>
            ) : null}
          </>
        ) : null}
      </div>

      {canSeeMarketing && pipelineQuery.data && channelEntries.length > 0 ? (
        <section className={styles.chartSection}>
          <h2 className={styles.chartTitle}>Leads by channel</h2>
          <div className={styles.chart} role="img" aria-label="Bar chart of leads by channel">
            {channelEntries.map(([channel, count]) => (
              <div key={channel} className={styles.chartRow}>
                <span className={styles.chartLabel}>{channel}</span>
                <div className={styles.chartBarTrack}>
                  <div
                    className={styles.chartBar}
                    style={{ width: `${(count / maxChannelCount) * 100}%` }}
                  />
                </div>
                <span className={styles.chartValue}>{count}</span>
              </div>
            ))}
          </div>

          {/* Accessible data-table equivalent alongside the chart
              (docs/design/PAGE_SPECIFICATIONS.md's Internal Reporting
              accessibility requirement) - visually hidden, not removed. */}
          <table className={styles.srOnlyTable}>
            <caption>Leads by channel</caption>
            <thead>
              <tr>
                <th scope="col">Channel</th>
                <th scope="col">Count</th>
              </tr>
            </thead>
            <tbody>
              {channelEntries.map(([channel, count]) => (
                <tr key={channel}>
                  <td>{channel}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {canSeeMarketing && pipelineQuery.data && channelEntries.length === 0 ? (
        <Alert variant="info">No leads yet — numbers will appear here once some come in.</Alert>
      ) : null}

      {canSeeData ? (
        <section className={styles.dataSection}>
          <h2 className={styles.chartTitle}>Data quality</h2>
          <p className={styles.dataLede}>
            Completeness and timeliness signals over the operational data itself, computed live -
            not a separate warehouse or stored aggregate.
          </p>

          {qualityQuery.isLoading ? (
            <div className={styles.statGrid}>
              <Skeleton className={styles.statSkeleton} />
              <Skeleton className={styles.statSkeleton} />
            </div>
          ) : null}
          {qualityQuery.isError ? (
            <Alert variant="error">Couldn&rsquo;t load data quality signals.</Alert>
          ) : null}
          {qualityQuery.data ? (
            <div className={styles.statGrid}>
              <StatCard
                label="Leads stuck in 'new' 14+ days"
                value={String(qualityQuery.data.leads.staleNewCount)}
              />
              <StatCard
                label="Clients with no engagement"
                value={String(qualityQuery.data.clients.withoutEngagementCount)}
              />
              <StatCard
                label="Overdue compliance items"
                value={String(qualityQuery.data.complianceItems.overdueCount)}
              />
              <StatCard
                label="Enrollments pending 7+ days"
                value={String(qualityQuery.data.academyEnrollments.stalePendingCount)}
              />
            </div>
          ) : null}

          <h3 className={styles.dictionaryTitle}>Data dictionary</h3>
          {dictionaryQuery.isLoading ? <Skeleton className={styles.statSkeleton} /> : null}
          {dictionaryQuery.isError ? (
            <Alert variant="error">Couldn&rsquo;t load the data dictionary.</Alert>
          ) : null}
          {dictionaryQuery.data ? (
            <div className={styles.dictionary}>
              {dictionaryQuery.data.tables.map((table) => (
                <details key={table.name} className={styles.tableDetails}>
                  <summary>
                    {table.name}{" "}
                    <span className={styles.columnCount}>({table.columns.length})</span>
                  </summary>
                  <ul className={styles.columnList}>
                    {table.columns.map((column) => (
                      <li key={column.name} className={styles.columnRow}>
                        <span className={styles.columnName}>{column.name}</span>
                        <span className={styles.columnType}>{column.dataType}</span>
                        {column.nullable ? (
                          <span className={styles.columnFlag}>nullable</span>
                        ) : null}
                        {column.sensitive ? (
                          <span className={styles.sensitiveFlag}>sensitive</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </StaffPortalLayout>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
