"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/useSession";
import { apiFetch } from "@/lib/api";
import type { LeadListItem, LeadStatus, LeadChannel } from "@/lib/leads";
import { AddLeadForm } from "@/components/AddLeadForm";
import { ConvertLeadForm } from "@/components/ConvertLeadForm";
import { StaffPortalLayout } from "@/components/StaffPortalLayout";
import styles from "./page.module.css";

const STATUS_OPTIONS: LeadStatus[] = ["new", "qualified", "converted", "lost"];
const CHANNEL_OPTIONS: LeadChannel[] = ["website", "whatsapp", "facebook", "linkedin", "other"];

// Matches the backend's requireRole lists on GET/POST /api/leads and
// POST /api/leads/:id/convert exactly (src/modules/crm/routes.ts) - this
// gate is a UX convenience only, the API re-checks every request
// regardless (docs/frontend/FRONTEND_SECURITY.md).
const CAN_VIEW = ["staff_marketing", "staff_advisory", "admin"];
const CAN_ADD = ["staff_marketing"];
const CAN_CONVERT = ["staff_advisory", "admin"];

export default function StaffLeadsPage() {
  const router = useRouter();
  const session = useSession();
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [channel, setChannel] = useState<LeadChannel | "">("");
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (channel) params.set("channel", channel);
  const query = params.toString();

  const leadsQuery = useQuery<{ leads: LeadListItem[] }>({
    queryKey: ["leads", status, channel],
    queryFn: () => apiFetch(`/api/leads${query ? `?${query}` : ""}`),
    enabled: session.isSuccess && !!session.data && CAN_VIEW.includes(session.data.role),
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

  if (!CAN_VIEW.includes(session.data.role)) {
    return (
      <section className={`max ${styles.section}`}>
        <p role="alert">You don&rsquo;t have access to this page.</p>
      </section>
    );
  }

  const canAdd = CAN_ADD.includes(session.data.role);
  const canConvert = CAN_CONVERT.includes(session.data.role);

  return (
    <StaffPortalLayout role={session.data.role}>
      <header className={styles.header}>
        <h1 className={styles.title}>Leads</h1>
        <p className={styles.lede}>Every inquiry that has come in, from the website and beyond.</p>
      </header>

      {canAdd ? <AddLeadForm /> : null}

      <div className={styles.filters}>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="filter-status">
            Status
          </label>
          <select
            id="filter-status"
            className={styles.filterSelect}
            value={status}
            onChange={(event) => setStatus(event.target.value as LeadStatus | "")}
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="filter-channel">
            Channel
          </label>
          <select
            id="filter-channel"
            className={styles.filterSelect}
            value={channel}
            onChange={(event) => setChannel(event.target.value as LeadChannel | "")}
          >
            <option value="">All</option>
            {CHANNEL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {leadsQuery.isLoading ? <p>Loading leads…</p> : null}
      {leadsQuery.isError ? (
        <p role="alert" className={styles.error}>
          Couldn&rsquo;t load leads. Try again shortly.
        </p>
      ) : null}

      {leadsQuery.data && leadsQuery.data.leads.length === 0 ? (
        <p className={styles.empty}>No leads match these filters.</p>
      ) : null}

      {leadsQuery.data && leadsQuery.data.leads.length > 0 ? (
        <ul className={styles.list}>
          {leadsQuery.data.leads.map((lead) => (
            <li key={lead.id} className={styles.row}>
              <div className={styles.rowMain}>
                <div className={styles.rowIdentity}>
                  <span className={styles.name}>{lead.name}</span>
                  <span className={styles.contact}>{lead.contact}</span>
                </div>
                <span className={styles.badge}>{lead.channel}</span>
                <span className={`${styles.badge} ${styles[`status_${lead.status}`] ?? ""}`}>
                  {lead.status}
                </span>
                <time className={styles.date} dateTime={lead.createdAt}>
                  {new Date(lead.createdAt).toLocaleDateString()}
                </time>
                {canConvert && lead.status !== "converted" ? (
                  <button
                    type="button"
                    className={styles.convertToggle}
                    onClick={() => setConvertingId(convertingId === lead.id ? null : lead.id)}
                  >
                    {convertingId === lead.id ? "Close" : "Convert"}
                  </button>
                ) : null}
              </div>

              {lead.statedNeed ? <p className={styles.statedNeed}>{lead.statedNeed}</p> : null}

              {convertingId === lead.id ? (
                <ConvertLeadForm leadId={lead.id} onDone={() => setConvertingId(null)} />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </StaffPortalLayout>
  );
}
