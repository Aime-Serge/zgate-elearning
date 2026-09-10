# Database Audit

**FACT:** No database exists. No schema, migration, ORM model, seed data, or connection configuration of any kind is present in the repository.

## What the business documents imply about future data entities (REQUIREMENT-shaped, not a schema)

These are business-domain entities named across the SLA, Data Privacy Policy, and Business Plan — useful as future domain-modeling input, not a proposal to implement now:

- **Client** — legal name, TIN, registered address, per the SLA signature block; a Client may engage one or more division Service Schedules (Advisory/Academy/Tech/Data) under one Master SLA.
- **Service Schedule / Engagement** — division-specific scope, fee structure, SLA metrics (response/turnaround targets differ per division — see `BUSINESS_ALIGNMENT.md`).
- **Deliverable** — explicitly defined term in the SLA ("any output, report, filing, system, dataset, or certificate").
- **Advisory-specific:** bookkeeping ledgers, VAT/EBM filings, National ID/TIN numbers, bank details — classified High sensitivity.
- **Academy-specific:** learner records (name, contact, attendance, assessment results), cohorts, certificates — classified Moderate sensitivity.
- **Tech-specific:** hosted systems, source code, credentials, uptime/incident logs — classified High sensitivity.
- **Data-specific:** raw and processed client datasets, reports/dashboards — classified High sensitivity (volume/variety).
- **Data retention:** engagement duration + statutory period (exact statutory retention period for Advisory tax/financial records is explicitly unconfirmed pending legal counsel — see `OPEN_QUESTIONS.md`), then secure deletion/return.
- **Data residency constraint:** personal data stored within Rwanda by default (Law N° 058/2021); any future schema/hosting decision must account for this before choosing a cloud region.

**ASSUMPTION:** A future platform will likely need per-division-scoped access control at the data layer (Annex A–D each specify "only staff assigned to that engagement" may access records, access must be logged) — this is a strong signal for row-level or engagement-scoped authorization design once a database is built, not a decision to make now.

No further database audit is possible until a database exists.
