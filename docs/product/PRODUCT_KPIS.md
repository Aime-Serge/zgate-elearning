# Z-GATE Digital Platform — Product KPIs

Product-level, instrumentation-focused metrics — distinct from the business's own Day-90/12-month KPIs (`docs/business/BUSINESS_REQUIREMENTS.md`, sourced from the Business Plan), which measure the *business's* success (10 retainer clients, 30+ learners, etc.) regardless of whether software is involved. These metrics measure whether the *platform itself* is doing its job. Where a product KPI supports a business KPI, that link is noted — but the product is not credited with a business outcome it didn't cause.

## MVP KPIs

| KPI | Target | Why this metric | Source dependency |
|---|---|---|---|
| Lead capture completeness | 100% of website form submissions become a lead record with no data loss | Directly measures FEAT-02.1's correctness — a lost lead is a lost prospect | ST-02 |
| Manual-lead logging adoption | Marketing Coordinator logs non-web leads within 1 business day of contact | Measures whether the CRM foundation is actually replacing informal tracking, not running alongside it | ST-03 |
| Lead-to-client conversion visibility | 100% of converted clients trace back to a lead record (no "orphan" clients created outside the system) | Tests whether ST-05's conversion flow is the real path staff use, not a parallel manual process | ST-05 |
| Advisory Associate tool adoption | 100% of active Advisory clients' compliance status is tracked in-platform, not on a side spreadheet | This is the core MVP promise — if the Advisory Associate still needs a spreadsheet, MVP has not replaced the actual problem | ST-08, ST-09 |
| SLA target visibility (not yet automation) | 100% of monthly close-outs/filings have a timestamped completion record, whether on-time or late | Enables honest measurement against SLA Schedule A's targets — the product's job at MVP is visibility, not enforcement | ST-09 |
| Client Portal adoption | At least 1 real Advisory client logs in and views their status within their first month of access | Tests whether the Client Portal is actually used, not just built | ST-07, ST-11 |
| MD reporting reliance | MD checks the internal reporting view instead of asking Advisory Associate/Marketing Coordinator directly, within the first month | Tests whether FEAT-07.1/07.2 actually replaced the manual weekly round-up described in Journey 3 | ST-13, ST-14 |

## V1 KPIs (defined now, measured once V1 ships)

| KPI | Target | Why this metric |
|---|---|---|
| Academy cohort completion tracked in-platform | 100% of Cohort 1/2 attendance and assessment recorded via the platform, not paper | Tests whether Academy's SLA targets (90% completion, 5-day certificate issuance) are measurable at all |
| Certificate issuance timeliness | ≥ 90% of certificates issued within the 5-business-day SLA target | Directly measures the business rule the product exists to support |
| Staff onboarding without engineering | 100% of new staff accounts created/deactivated by the MD via Admin Platform, zero requiring a developer | Tests FEAT-09.2's core promise |

## V2 KPIs (defined now, measured once V2 ships)

| KPI | Target | Why this metric |
|---|---|---|
| Tech ticket SLA visibility | 100% of logged tickets have a recorded first-response timestamp against their severity target | Enables honest measurement against SLA Schedule C |
| Data external-delivery adoption | First external Data client receives ≥ 1 monthly report via the platform (not ad hoc) | Tests whether FEAT-11.1 actually replaced manual delivery |
| Access review completion | Quarterly access review completed and exportable, on schedule | Tests whether FEAT-12.2 makes the Data Privacy Policy's §7 commitment actually happen, not just remain a policy statement |

## What this document does not do

It does not restate the Business Plan's own Day-90 targets (10 Advisory clients, 30+ Academy learners, 500+ leads, etc.) as product KPIs — those are business outcomes the product can *support* but cannot itself guarantee, since they depend on sales, marketing execution, and market response, not software correctness. Conflating the two would make it impossible to tell whether a miss is a product failure or a business-execution one. Where a product KPI target looks small (e.g., "at least 1 client logs in"), that reflects MVP's genuinely small real user base today (Day 22 of 90, single Advisory client(s)) — not a lack of ambition.
