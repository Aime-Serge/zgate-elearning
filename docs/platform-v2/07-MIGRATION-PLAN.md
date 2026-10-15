# 07 — Migration Plan: From the v1 Scaffold to v2

## 1. Target repository layout

```
z-gate/
├── apps/
│   ├── website/          Next.js, SSG + ISR → CDN            (from frontend/ public pages)
│   ├── learn/            Next.js LMS (learner, trainer, admin) (new + frontend/staff/academy)
│   ├── ops/              Next.js client portal + staff console (from frontend/portal, staff/*) [D2]
│   ├── cms/              Payload CMS 3                       (new)
│   └── api/              Fastify modular monolith            (from backend/)
│       ├── src/
│       │   ├── contexts/ identity · crm · lms/{catalog,learning,assessment,credentials}
│       │   │             · commerce · ops/{clients,advisory,documents,reporting} · platform/{audit,outbox,notifications,media,jobs}
│       │   ├── shared/   errors · config · db · http (auth preHandler, params validation) · storage
│       │   ├── server.ts entry: HTTP
│       │   └── worker.ts entry: pg-boss consumers (same image)
│       ├── db/migrations/   forward-only SQL, one Postgres schema per context
│       └── db/seeds/        synthetic dev and staging data
├── packages/
│   ├── ui/               design tokens + accessible React components (from frontend/src/components, globals.css)
│   ├── contracts/        Zod schemas shared by the API and the frontends (ends hand-mirroring)
│   ├── api-client/       typed client generated from OpenAPI
│   ├── i18n/             message catalogs en / rw / fr
│   └── config/           tsconfig, eslint, prettier presets
├── infra/
│   ├── compose/          local.yml · staging.yml · production.yml
│   ├── caddy/            Caddyfile per environment (path routing, trusted proxy, headers)
│   ├── ansible/          host hardening + deploy
│   ├── observability/    Grafana / Prometheus / Loki / Tempo config, dashboards, alert rules
│   └── secrets/          SOPS-encrypted env files
├── docs/
│   ├── platform-v2/      this document set
│   ├── adr/              ADR-001 to ADR-006 (moved) + ADR-007 onward (from §5 below)
│   ├── runbooks/         deploy, rollback, incident, backup/restore, breach
│   └── archive/v1-phases/ discovery … release (history, read-only)
├── .github/workflows/    ci.yml (affected), release.yml (build once, sign), deploy.yml (environments)
├── pnpm-workspace.yaml · turbo.json · package.json
```

## 2. What happens to every part of v1

**K** = keep as-is (moved) · **R** = refactor · **B** = rebuild · **X** = retire

### Backend

| v1 path | Disposition | Notes |
|---|---|---|
| `backend/src/lib/errors.ts` | K → `api/src/shared` | The error taxonomy and envelope are good |
| `backend/src/lib/config.ts` | R | Same pattern; add every runtime value (proxy CIDR, storage, queues, vendors); fail fast |
| `backend/src/lib/db.ts` | R | Generated types (`kysely-codegen`); one DB role per context; `statement_timeout` |
| `backend/src/lib/auth.ts` | R | Argon2id, with bcrypt rehash on next login |
| `backend/src/lib/session.ts`, `authz.ts` | **B** | Server-side sessions, memberships, declarative route policies (N-3, N-4, F-4) |
| `backend/src/lib/engagementAccess.ts` | R | Becomes an engagement-scoped membership check |
| `backend/src/lib/audit.ts` | R | Writes `platform.audit_events` (N-10); same "inside the transaction" rule |
| `backend/src/lib/storage.ts` | R | Same two-function interface; S3 driver; signed URLs |
| `backend/src/lib/email.ts` | R | Notifications port; queued; timeout (N-8) |
| `backend/src/lib/fileSignature.ts`, `token.ts` | K | |
| `backend/src/app.ts` | R | `trustProxy` (N-1); route params validated (N-7); Helmet without defaults (F-3); contexts registered as plugins; `/api/v1` |
| `backend/src/health.ts` | K + extend | Readiness also checks storage and the queue |
| `modules/identity` | R | Plus sign-up, verification, OTP, MFA, invites, reactivation (F-2), "sign out everywhere" |
| `modules/crm` | R | Audit (F-1), attribution, consent, `interest` field |
| `modules/clients`, `advisory`, `documents`, `reporting` | K → `contexts/ops` | Moved unchanged with their tests; feature-frozen until D2 |
| `modules/academy` | **B** → `contexts/lms` | Cohort, attendance and trainer-scope logic is ported into `lms.learning`. Data migrated (§2.3). |
| `backend/db/migrations/001–016` | K (as history) | New migrations `100+` create the context schemas and move tables (`ALTER TABLE … SET SCHEMA`) |
| `backend/scripts/migrate.mjs` | R | Advisory lock; per-schema ordering; used by dev Compose too (N-9) |
| Tests (97 cases) | K → moved | Keep running on the moved code; they are the regression net for the move |
| `backend/Dockerfile` | R | One image, two entry points (server and worker); read-only root filesystem |

### Frontend

| v1 path | Disposition | Destination |
|---|---|---|
| `frontend/src/app/{page,about,advisory,tech,data,contact}`, `robots.ts`, `sitemap.ts`, `error.tsx`, `not-found.tsx` | R | `apps/website` (content comes from the CMS; site URL from runtime config) |
| `frontend/src/app/academy`, `academy/enroll`, `components/EnrollmentForm` | X / R | The Academy overview becomes a website page. Enrollment moves to the LMS. |
| `frontend/src/app/{login,forgot-password,reset-password}` | R | `apps/learn` (and `apps/ops`), sharing `packages/ui` auth components |
| `frontend/src/app/staff/academy/**` | R | `apps/learn` trainer console |
| `frontend/src/app/portal/**`, `staff/{clients,leads,reporting}/**` | K | `apps/ops` (D2) |
| `frontend/src/components/{Alert,Button,Card,Modal,Skeleton,StatusCard,GateMark}` | K → `packages/ui` | Plus Storybook-style visual docs (optional) |
| `frontend/src/components/{Header,Footer,DivisionPage,ContactForm}` | R | `apps/website` |
| `frontend/src/components/{AddLeadForm,ConvertLeadForm,UploadDeliverableForm,PortalNav,StaffNav,StaffPortalLayout}` | K | `apps/ops` |
| `frontend/src/lib/content.ts` | X (after seeding the CMS) | Payload seed script |
| `frontend/src/lib/schema.ts` | X | Replaced by `packages/contracts` |
| `frontend/src/lib/api.ts`, `useSession.ts` | R | `packages/api-client`. Relative `/api/v1` base URL; no `NEXT_PUBLIC_API_URL` (N-2). |
| `frontend/next.config.ts` | R | Website: static headers. learn/ops: nonce CSP in middleware (F-5); `poweredByHeader: false` |

### Data migration (Academy → LMS)

1. Create `identity.users` rows for each `learners` row as **unclaimed** users, carrying name and contact. When the contact is an email or phone number, it becomes a verification target the learner can use to claim the account.
2. Map `courses` to `lms.courses` and `course_versions`:
   - Parse the fee text into an integer amount plus `RWF`, with a manual check (there are only 2 rows).
   - Mark each as `published`.
3. Map `cohorts` to `lms.cohorts`, and `trainer_id` to `cohort_trainer` memberships.
4. Map `enrollments`, `attendance_records`, `assessments` and `certificates` across:
   - Generate a `verification_code` for each existing certificate.
   - Re-render existing certificates as PDFs.
5. Before cut-over, a scripted reconciliation compares row counts and spot-checks each table. v1 had no production data, so in practice this mostly exercises the scripts on staging fixtures.

## 3. Phased roadmap

Effort is in **person-weeks (pw)**, assuming **one senior full-stack lead plus one junior developer** working in parallel. These are planning estimates with ±40% uncertainty, not commitments, and they exclude **course content production** (see risks).

| Phase | Scope | Exit criteria | Effort |
|---|---|---|---|
| **0. Stabilize and decide** | Fix F-1, F-2, F-6, F-7, N-1 in v1. Interim N-2 fix (build args). Decisions D1–D6 (§4). Start payment-aggregator onboarding/KYC. Start NCSA/DPO/DPIA. Monorepo skeleton with v1 moved in, **all 97 tests still green**. | CI green on the monorepo; decision log signed; aggregator application submitted | 2–3 pw |
| **1. Platform foundations** | Identity v2 (sessions, memberships, sign-up/OTP/MFA/invites); audit events; outbox and pg-boss worker; S3 storage; notifications; `/api/v1` + OpenAPI + contracts; generated DB types; Caddy routing; **staging environment with monitoring, backups and a restore drill** | Staging is live; login, sign-up and MFA work end to end; the first restore drill passes; alerts fire in a test | 6–8 pw |
| **2. Website v2** *(parallel with Phase 1)* | `apps/website` + `apps/cms`; content seeded; commercial-readiness fixes; privacy and terms pages; consent on forms; analytics; Lighthouse and axe budgets; CDN deployment | **Website live in production**: real leads flow into CRM with audit and attribution. Highest commercial value for the least risk. | 3–5 pw |
| **3. LMS MVP** | The 16 MVP capabilities ([03 §3](../../elearning/docs/03-ELEARNING-PLATFORM.md#3-scope-by-release)): catalog/versions, lessons and video, progress, quizzes, MoMo/Airtel checkout, certificates and verification, trainer console, admin, privacy tooling; Academy data migration; k6 load test; external pentest; DPIA signed | First paid cohort of Course 1 runs fully on `learn.{domain}`; SLOs met during the cohort; zero open High/Critical security findings | 14–20 pw |
| **4. LMS V1** | B2B organizations and seats; assignments; Kinyarwanda UI; PWA offline; WhatsApp notifications; learning analytics; discount codes | One corporate client cohort; the Kinyarwanda UI used by real learners | 10–16 pw |
| **5. Ops portal and AI pilots** | Execute D2 (keep, replace or retire the ops portal, including the CR-8 invite flow for Advisory clients if kept); AI pilot #1 (captions) once D11 is decided | Per decision | TBD |

**Critical path to the first paid online cohort:** Phases 0 → 1 → 3, about **22–31 pw**. With two developers that is roughly **3–4 months of calendar time**. The website (Phase 2) can launch about 6–8 weeks in.

## 4. Decisions needed from the Managing Director

| ID | Decision | Recommendation | Blocks |
|---|---|---|---|
| D1 | Build a focused LMS, or adopt one (Moodle / SaaS)? | **Build** on the existing stack, with Moodle as an explicit stopgap if Phase 3 can't be staffed ([03 §1](../../elearning/docs/03-ELEARNING-PLATFORM.md#1-product-definition)) | Phase 3 |
| D2 | Future of the ops portal (client portal + staff CRM/compliance) | **Keep, moved and feature-frozen.** Revisit when the first Advisory client actually needs portal access; at that point build only the invite flow (CR-8). Replacing it with SaaS conflicts with residency. | Phase 5 |
| D3 | Hosting region / residency (ADR-004) | **Option 3, hybrid,** as in [02 §9](02-TARGET-ARCHITECTURE.md#9-data-residency-map-adr-004-option-3-hybrid-made-concrete), with legal counsel | Phase 1 production provisioning |
| D4 | Production domain (`zgaterw.com` or `zgate.co`, open in `docs/marketing/SEO_STRATEGY.md`) | Decide now; HSTS preload, email sending domain and SEO all depend on it | Phase 2 |
| D5 | Payment aggregator | Shortlist and start KYC in Phase 0: MoMo + Airtel coverage, webhook signing, settlement time, fees, and NCSA sub-processor fit | Phase 3 |
| D6 | Quiz retake and remediation policy (OBQ #12) | For example: 2 retakes, 24 h cool-down, remediation lesson unlocked after a fail. The business decides. | Phase 3 |
| D7 | Minimum learner age / guardian consent | 18+ at launch, unless a youth programme is planned | Phase 3 |
| D8 | Language rollout order | `en` at launch, `rw` UI in V1, `fr` on demand | Phase 4 |
| D9 | Self-paced product and pricing | Decide after the first cohort's data | Phase 4 |
| D10 | Team | **Contract a senior full-stack lead.** The v2 scope (payments, identity, an LMS) is beyond a junior-only team, and the bus-factor risk is already noted in `docs/HANDOVER.md`. | Phase 1 |
| D11 | AI scope (OBQ #16) | Approve pilot #1 (captions/transcripts) only; everything else after a DPIA | Phase 5 |
| — | NCSA registration and DPO appointment (existing) | Start immediately; these are now **hard launch gates** for the LMS | LMS launch |

## 5. Proposed ADRs

Each will become `docs/adr/ADR-0xx-*.md` with Status: Proposed, then Accepted once the decision is made.

| # | Title | Decision | Supersedes / relates to |
|---|---|---|---|
| ADR-P1 | Split into Website and E-Learning products; build a focused LMS | Two products, separate hosts, the hand-off contract in [02 §6](02-TARGET-ARCHITECTURE.md#6-how-the-website-hands-off-to-the-lms); build, with a Moodle stopgap | Extends ADR-001's module map |
| ADR-P2 | pnpm + Turborepo monorepo | Replace two independent packages with workspaces and shared packages | **Reverses** the "not a workspace" decision in `docs/frontend/FRONTEND_ARCHITECTURE.md` |
| ADR-P3 | Server-side sessions and scoped memberships | Revocable sessions; roles as rows with scopes; Argon2id; MFA for staff | Amends ADR-005 (still in-house); adds an OIDC IdP adoption trigger |
| ADR-P4 | Same-origin API via edge proxy; runtime configuration | Caddy routes `/api/*`; no build-time environment values; `trustProxy` pinned | Fixes N-1 and N-2 |
| ADR-P5 | Postgres-backed jobs and transactional outbox | pg-boss + `platform.outbox`; no broker | Implements `docs/backend/BACKGROUND_JOBS.md` |
| ADR-P6 | Headless CMS for the website | Payload CMS, self-hosted | — |
| ADR-P7 | Object storage and managed video | S3 API (MinIO) for private files; managed HLS video CDN for course media | Implements ADR-004 option 3 |
| ADR-P8 | Payments: record, don't bill | Mobile-money aggregator, webhook-driven; EBM invoicing stays with the certified provider | **Refines** ADR-006 (payments now recorded in-platform; billing still out of scope) |

## 6. Risks of the re-platform

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Course content isn't ready.** A platform with no lessons earns nothing. | High | High | Start scripting and recording Course 1 in Phase 0. The content owner is the Academy Trainer, not engineering. Budget for captions and transcripts. |
| Payment aggregator onboarding (KYC, contracts) takes weeks | High | High | Apply in Phase 0. Keep manual "mark as paid" (MoMo merchant code or bank transfer) as the launch fallback. |
| Compliance gates (NCSA, DPO, DPIA) are still open at launch | Medium | High | Start in Phase 0; track as launch-blocking items; this document makes them explicit |
| Single-developer bus factor | High | High | D10; pair on identity and payments; runbooks; CODEOWNERS |
| LMS scope creep | High | Medium | The MVP list in [03 §3](../../elearning/docs/03-ELEARNING-PLATFORM.md#3-scope-by-release) is fixed; anything else goes to V1 by default |
| Regressions while moving v1 code | Medium | Medium | Move first, refactor second; the 97 existing tests must stay green at every step |
| Video costs grow faster than revenue | Medium | Medium | 240p start, data-saver default, monthly cost-per-learner review ([06 §7](06-DEVOPS-RELIABILITY.md#7-cost-discipline)) |
| Kinyarwanda quality (UI or AI) | Medium | Medium | Native-speaker review is a release gate for every `rw` string |
| Over-engineering for the scale | Medium | Medium | Every scale-out step has a measured trigger ([02 §8](02-TARGET-ARCHITECTURE.md#8-scale-path-only-when-evidence-triggers-it)); defaults are deliberately boring |
