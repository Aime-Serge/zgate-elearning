# Z-GATE Digital Platform — Security Testing Strategy

**This document is a strategy, not a report.** No code exists yet (`docs/discovery/CURRENT_FUNCTIONALITY.md`), so no testing — destructive or otherwise — has been or could be performed against a real system. Per this phase's explicit instruction, **no destructive testing was performed to produce this document.** Everything below is what testing *will* consist of once implementation begins, sequenced against `docs/architecture/DEPLOYMENT_ARCHITECTURE.md`'s CI/CD pipeline.

## Testing layers

### 1. Static Application Security Testing (SAST) — every commit

- Runs in CI on every pull request, before merge — catches injection risks, insecure patterns, and common OWASP Top 10 classes at the code-review stage, where fixing them is cheapest.
- Proportionate to team size: a well-configured, free/open-source SAST tool integrated into CI is sufficient at this scale — no dedicated security-tooling budget is assumed given the Financial Model's tiny shared tools line (`docs/architecture/DEPLOYMENT_ARCHITECTURE.md`'s cost baseline).

### 2. Software Composition Analysis (SCA) / dependency scanning — every commit + scheduled

- Scans the dependency tree for known-vulnerable packages on every commit and on a recurring schedule (new CVEs can affect already-merged code).
- Directly answers `THREAT_MODEL.md` §14's supply-chain risk.

### 3. Secrets scanning — every commit, pre-commit where possible

- Prevents credentials/API keys from ever reaching version control — `docs/discovery/SECURITY_BASELINE.md` already flagged this as not yet configured; it must be in place **before the first commit containing any real credential**, not added retroactively.

### 4. Manual code review against `SECURITY_REQUIREMENTS.md`

- Every pull request touching `identity`, `clients`, `advisory`, or `documents` (the ASVS L2 modules) is reviewed specifically against the relevant ASVS-chapter requirements in `docs/security/SECURITY_REQUIREMENTS.md` — not just general code quality.
- Given a small/junior team, this review is the most realistic control available at MVP scale — it does not require tooling budget, only discipline, and it directly targets the `THREAT_MODEL.md` risk-summary items (object-level authorization, role escalation) that automated tooling alone won't reliably catch.

### 5. Dynamic Application Security Testing (DAST) — staging only, authorized scope

- Automated DAST scanning against the **staging environment only**, never production, and never using real Client data (staging never holds it, per the already-committed separation rule).
- Scoped, authorized, non-destructive by design — this is the appropriate way to satisfy "do not perform destructive testing" while still getting real dynamic-testing coverage once a deployed system exists.

### 6. Manual/targeted penetration testing — deferred, cost-gated, not a launch blocker

- A professional third-party penetration test is genuinely valuable but carries real cost the Financial Model's current 90-day budget does not accommodate (`docs/architecture/DEPLOYMENT_ARCHITECTURE.md`'s cost baseline covers "Tools & software," not a security-audit line item).
- **Recommendation:** commission a scoped, authorized penetration test once the platform is handling real Client financial data at meaningful scale (a reasonable trigger: once Advisory approaches or exceeds its Day-90 target of 10 retainer clients, or before any external Tech/Data client engagement begins, given `THREAT_MODEL.md`'s finding that the blast radius of a single compromised account is already the entire client base). This is a cost-conscious phasing decision, not a security shortcut — flagged explicitly so it isn't forgotten, not quietly dropped.
- Any penetration test, when commissioned, must be formally authorized in writing (scope, dates, rules of engagement) before it begins — standard practice, restated here because this is a compliance-sensitive business where an unauthorized/unscoped test against production would itself be a serious incident.

### 7. Security regression testing

- Test cases for previously-identified `THREAT_MODEL.md` risks (especially the Critical-rated object-level authorization and role-escalation items) become permanent automated regression tests in CI — a control that passed once must keep passing on every future change, not just at initial implementation.

## Testing priority (matches `THREAT_MODEL.md`'s risk summary, not a generic checklist order)

1. Object-level authorization (a client cannot access another client's data — tested explicitly, not assumed from role checks alone).
2. Role-escalation resistance (a client-role account cannot become staff/admin by any request manipulation).
3. Staff-account compromise blast radius (session handling, credential storage, MFA availability for the highest-privilege accounts).
4. Everything else, in standard OWASP-informed priority order.

## What this document does not do

It does not report any actual vulnerability found — none has been looked for yet, since nothing is built. It does not commit to a specific SAST/SCA/DAST vendor or tool — implementation-phase choices, made to satisfy the layers above. It does not perform, simulate, or describe results of any destructive or intrusive test against any live system, consistent with this phase's explicit instruction.
