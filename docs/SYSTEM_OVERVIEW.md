# Z-GATE Digital Platform — System Overview

**Audience:** anyone inheriting this system — a new engineer, a new owner, an auditor — who needs the five-minute version before going deeper. This is the front door into `docs/`; every claim below links to the document that proves it, rather than re-arguing it here.

## What this is

Z-GATE LTD is a real Rwandan company ("Where Business Meets Technology") operating four integrated divisions: **Advisory** (tax/compliance), **Academy** (professional training), **Tech** (software/systems), and **Data** (analytics/BI). This repository is the digital platform built to run that business: a public marketing website, a lead-capture/CRM pipeline, a staff-facing operations platform, a client-facing portal, and the Academy's course/cohort/enrollment system — all as one modular-monolith application, not four disconnected tools.

The platform's own positioning is the product's actual differentiation, not just marketing copy: a client gets one integrated relationship across all four divisions instead of four separate vendors who don't talk to each other. That claim is structurally true in the codebase — Academy curricula reference Advisory's real casework, Data's dashboards read the same operational tables Advisory and Academy write to, and every division's client record is the same `clients` row, not four disconnected systems awkwardly bridged.

## Who built what, and how

This platform was built through a long, deliberately sequential engagement — business analysis and product/UX/design phases before any code, then architecture and security design, then implementation module by module, then specialized review passes (QA, security, performance, SEO, DevOps, release management, an independent security audit, a commercial-readiness review), each producing real, reviewed documentation before the next phase began. `docs/discovery/` through `docs/backend/` is that history, in order — nothing in this codebase was invented ahead of an approved decision, and the git history (`git log --oneline`) is a literal, readable record of that sequence.

## Business modules actually built

| Module | What it does | Built in |
|---|---|---|
| Public website | Home, About, Advisory, Academy, Tech, Data, Contact, Academy enrollment — real approved copy only, no fabricated claims | `frontend/src/app/*` |
| Identity & access | Login, password recovery, session management, RBAC, admin account deactivation | `backend/src/modules/identity/` |
| CRM | Public lead capture, staff lead management, lead→client conversion | `backend/src/modules/crm/` |
| Client Portal | Authenticated clients view their own engagement status and deliverables | `frontend/src/app/portal/`, `backend/src/modules/clients/` |
| Staff Platform | Client list/detail, compliance tracking, deliverable upload, reporting | `backend/src/modules/advisory/`, `backend/src/modules/documents/`, `backend/src/modules/reporting/` |
| Academy | Course/cohort/enrollment/attendance/assessment/certificate workflow | `backend/src/modules/academy/` |
| Data & BI | Reporting endpoints, data dictionary, data-quality signals for staff | `backend/src/modules/reporting/` |

**Deliberately not built**, per explicit, documented scope decisions made during the engagement (not oversights): a Tech-division client-facing offering (evaluated and declined — "for a client that doesn't exist yet"), a dedicated Admin UI beyond the `admin` role's existing API capabilities, Case Studies/Insights content pages (gated on a real completed engagement that hasn't happened), Kinyarwanda/French localization (an open business question), and a client account self-service signup/invite flow — see **Known limitations** in `docs/HANDOVER.md`, which is the one gap serious enough to be a real release blocker, not a deferred nice-to-have.

## Current status, stated plainly

- **Code quality:** strong. Lint/typecheck/tests/build clean on both packages; 0 dependency vulnerabilities; real CI now running on GitHub Actions (not just local verification) as of the release-candidate phase.
- **Production deployment:** has not happened. No cloud provider or hosting region is chosen (`docs/architecture/ADR/ADR-004-data-residency-hosting-region.md` remains open, pending Rwanda data-residency/NCSA registration decisions the business, not engineering, must make).
- **Release readiness:** an independent security audit and a commercial-readiness review, both run *after* the release-candidate phase, found real, unresolved issues — see `docs/SECURITY_GUIDE.md` and `docs/HANDOVER.md`. This system is well-built and close, not finished.

## Where to go next

- Building or extending the system: `docs/DEVELOPER_GUIDE.md`
- Understanding the technical architecture: `docs/ARCHITECTURE.md`
- Operating it day to day: `docs/OPERATIONS_GUIDE.md`
- Security posture and open findings: `docs/SECURITY_GUIDE.md`
- What's left before a real launch: `docs/HANDOVER.md`, `docs/ROADMAP.md`
