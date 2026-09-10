# Security Baseline

## Application security

**FACT:** No application code exists, so no code-level security scan (hard-coded secrets, insecure auth, missing authorization, unsafe uploads, weak headers, insecure cookies, missing rate limiting, dependency vulnerabilities) is possible or applicable. **INFORMATIONAL — nothing to classify as CRITICAL/HIGH/MEDIUM/LOW at this time.**

## Repository hygiene

- **MEDIUM:** No `.gitignore` exists yet. Low current risk (no build artifacts, dependency directories, or `.env` files present to accidentally commit), but should be added before any project code is scaffolded, to avoid future secret/artifact leaks.
- **INFORMATIONAL:** No secret-scanning or pre-commit hook tooling is configured — not yet needed (no code), but worth establishing as a foundation-phase item once development starts, given the sensitivity of the data this company will eventually handle (National ID/TIN numbers, bank details, tax filings).

## Compliance/regulatory security posture (FACT — status as documented, not verified independently)

The **Data Privacy & Security Policy** (`zgate-data-privacy-security-policy.docx`) is explicitly marked **"Draft — pending Managing Director approval and NCSA registration"** (issued 27 Aug 2026, v2.0 draft as of 28 Aug 2026). Its own compliance checklist lists these items as still **Pending** as of the document's last recorded state:

- [ ] Register Z-GATE with NCSA (National Cyber Security Authority) as data controller/processor
- [ ] Designate and record a Data Protection Officer (DPO)
- [ ] Confirm data-breach notification form/contacts (`databreach@dpo.gov.rw`)
- [ ] Confirm statutory retention period for Advisory tax/financial records with counsel
- [ ] Legal counsel review of the policy itself

**HIGH (process/compliance, not technical):** Until NCSA registration and DPO designation are complete, Z-GATE does not yet have an operational answer to "who do we notify, and how, if a breach happens" beyond the policy's own draft commitments (DPO notified within 24 hours of internal discovery; NCSA notified within 48 hours; affected client notified within 48 hours, per Articles 43–44 of Law N° 058/2021). This is a real operational gap for a company about to start handling client financial and personal data under live SLAs — it exists independent of any software platform.

**Baseline technical controls the policy commits to** (for future implementation, not yet built): least-privilege role-based access reviewed quarterly, unique credentials + MFA where supported, encryption in transit (HTTPS/TLS) and at rest where supported, patch cycle with critical patches within 5 business days, tested periodic backups, Rwanda-default data residency, sub-processor security assessment before adoption.

## Note on scope

No destructive or intrusive testing was performed or attempted. No external systems were probed. This is a document-review baseline only, consistent with the non-destructive constraint in the operating brief.
