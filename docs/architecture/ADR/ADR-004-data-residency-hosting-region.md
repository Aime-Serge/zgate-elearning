# ADR-004: Data Residency & Hosting Region

**Status:** OPEN — requires Managing Director and legal counsel decision. This ADR lays out the real tension and the options; it does not pick one, because doing so would mean either asserting infrastructure this document cannot confirm exists, or accepting a compliance gap silently. Neither is an architect's call to make unilaterally on a company's regulatory posture.

## Context

The Data Privacy & Security Policy commits, in writing, to storing personal data "within Rwanda by default," with any offshore storage requiring "an NCSA-issued certificate authorizing that transfer, and written notice to the affected Client before the transfer begins" (`docs/business/BUSINESS_RULES.md` §4, citing Law N° 058/2021). Separately, `docs/discovery/SECURITY_BASELINE.md` found that Z-GATE's own NCSA registration — the prerequisite for either being a compliant in-Rwanda data controller/processor *or* obtaining a valid offshore-transfer certificate — is still **"Pending"** as of the last recorded state across every phase of this engagement.

No approved business document confirms a specific Rwanda-based hosting provider or a specific hyperscaler region with confirmed Rwanda presence. This document does not have independent knowledge of a verified Rwanda-region offering from a major cloud provider as of the information available to it, and will not assert one exists without confirmation — doing so would be exactly the kind of fabrication this entire engagement has consistently refused to do (`docs/marketing/MARKETING_STRATEGY.md`'s proof-strategy discipline applies here just as much as it applies to marketing claims).

## Options to evaluate (not a recommendation of one over the others — genuinely requires input this document doesn't have)

1. **A Rwandan or East African local hosting/data-center provider**, if one exists with adequate reliability and a reasonable cost fit against the Financial Model's tiny shared tools/hosting budget (`docs/architecture/DEPLOYMENT_ARCHITECTURE.md`'s cost baseline). Most directly satisfies "Rwanda by default" without needing an offshore-transfer certificate at all.
2. **The nearest confirmed-available major cloud region** (e.g., a regional African or nearby international region from an established provider), paired with completing NCSA registration and obtaining the required offshore-transfer certificate before real Client personal data is stored there. Requires the NCSA registration (already a known, tracked open item — `docs/discovery/OPEN_QUESTIONS.md`) to actually complete first.
3. **A hybrid approach**: self-hosted infrastructure physically located in Rwanda for anything classified Confidential/personal data, with non-sensitive components (e.g., static public-website assets) served from wherever is cheapest/fastest, since public marketing content carries no data-residency obligation (`docs/architecture/DATA_ARCHITECTURE.md`'s classification table).

## What this blocks

`docs/architecture/DEPLOYMENT_ARCHITECTURE.md`'s infrastructure topology is written to be region-agnostic specifically because of this open item — no specific provider or region is named anywhere in this architecture phase's output. Real infrastructure provisioning cannot proceed to a specific vendor choice until this ADR is resolved.

## Recommendation on process, not outcome

Resolve NCSA registration status first (it's already tracked as pending across three prior phases) — its outcome directly informs which of the three options above is even legally available. Loop in Rwandan legal/regulatory counsel before committing real Client data to any specific infrastructure choice, exactly as every business document reviewed in this engagement has itself insisted on ("review by qualified Rwandan legal counsel" appears on nearly every approved document's own disclaimer).

## Consequences of leaving this open

Development and staging environments (which never hold real Client data, per the already-committed separation rule) are not blocked by this ADR and can proceed on any reasonable, cheap infrastructure immediately. Only the *production* deployment of real Client personal/financial data is gated on this decision.
