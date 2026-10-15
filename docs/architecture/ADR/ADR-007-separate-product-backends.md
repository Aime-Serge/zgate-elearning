# ADR-007: Separate Products, Separate Backends

**Status:** Accepted (2026-10-14, direction from Z-GATE leadership). Amended 2026-10-15: repository layout and enforced boundaries (see "Amendment" below); the website split into a public frontend and a headless CMS (see "Second amendment").
**Amends:** ADR-001 (scope of "the monolith"); `docs/platform-v2/02-TARGET-ARCHITECTURE.md` §2–§4 (which proposed one shared API)

## Context

v1 was one application containing the whole business: marketing site, CRM, client portal, staff console and Academy. Leadership has decided Z-GATE needs two separate digital products:
- a **corporate website**, which is needed first;
- an **e-learning platform**, built afterwards.

The website should direct learners to the e-learning platform rather than contain it.

The architecture review (`docs/platform-v2/`) first proposed one shared modular-monolith API behind both products. Once the website became the first deliverable, with no login and no learner data, that coupling stopped paying for itself. The website would have to wait for platform foundations it doesn't use.

## Decision

Each product owns its backend and its data:

| Product | Backend | Data |
|---|---|---|
| Website (`website/frontend` + `website/backend`) | **Payload CMS, headless** (`website/backend`): content admin, REST API, lead intake, lead inbox and staff login. The public pages are a separate Next.js app (`website/frontend`) that reads the CMS over HTTP. *(Originally one deployable with Payload embedded; see the second amendment.)* | Its own Postgres database: content, media metadata, leads, consents |
| E-learning (`elearning/frontend` + `elearning/backend`) | The v1 Fastify backend, evolved into the LMS API (ADR-001 still applies *within* it) | Its own Postgres database: identity, LMS, commerce, plus v1 ops tables until D2 is decided |

Rules:
1. **No shared database, tables or sessions.** One Postgres *server* may host both databases to keep operating cost low, but each product has its own database and its own DB user.
2. **Integration only through versioned contracts**, defined in `shared/contracts` (`@zgate/contracts`):
   - LMS → website: a public catalog API, plus a signed `course.published` webhook that triggers revalidation.
   - Website → LMS: enroll deep links carrying UTM parameters.
   - Website → CRM: lead forwarding by signed webhook, once a CRM consumer exists.
3. **Shared code goes in `shared/`, never in a shared runtime:** `shared/ui`, `shared/contracts`, `shared/config`.
4. Until the LMS launches, the website's course buttons open a **waitlist** (the `enrollmentMode` site setting). Switching that setting to `lms` changes them to deep links. That switch is the planned hand-over point.

## Why

- **The website ships independently.** It doesn't wait for identity, payments or LMS foundations.
- **Failure isolation.** An LMS or API outage can't take the website or its forms down, and the reverse holds too.
- **Smaller blast radius for personal data.** The website database holds only leads and consents, never learner, payment or client data.
- **Fit for purpose.** A CMS-backed site gives marketing staff editing without developers, which a hand-written API wouldn't.

## Consequences

- Two databases to back up and monitor. This is mitigated by one Postgres server and one backup mechanism for both.
- Staff log in to the website CMS and to the LMS separately. Acceptable at this size; an OIDC identity provider becomes the answer if a third logged-in product or enterprise SSO appears (`docs/platform-v2/02-TARGET-ARCHITECTURE.md` §5).
- Leads live in the website database first. Forwarding them to a CRM is a later, contract-based step, not a schema dependency.
- The rest of `docs/platform-v2/` still applies: security baseline, residency map, LMS scope, DevOps practices. Only the "one API for every product" topology is replaced.

## Amendment (2026-10-15): one folder per product, enforced boundaries

The first implementation put every deployable under `apps/` and shared code under `packages/`. That layout let any app import any other, and one CI workflow ran for every change. The repository is now organized by product, so the separation above is visible in the tree and checked by tooling:

```text
website/app                   the website (Next.js + Payload, one deployable;
                              split later - see the second amendment)
elearning/frontend            the LMS frontend (skeleton)
elearning/backend             the LMS API (the v1 backend)
shared/{config,ui,contracts}  the only code both products may use
legacy/ops                    the frozen v1 portal (D2)
```

Added rules:

5. **Import boundaries are enforced**, not only agreed. `website/` and `elearning/` never import each other; both import only from `shared/`; `shared/` imports from no product; nothing imports from `legacy/`. dependency-cruiser checks this (`pnpm lint:boundaries`, `.dependency-cruiser.cjs`), and every CI workflow runs it.
6. **Each product owns its delivery path:** its own `.env.example` at the product root, Dockerfiles, Compose file (`infra/compose/website.yml`, `elearning.yml`) and CI workflow (`.github/workflows/website.yml`, `elearning.yml`, plus `legacy.yml`). A workflow runs only on changes to its product, `shared/` or root configuration.
7. **Rule 1 made concrete:** one Postgres server hosts `zgate_website` and `zgate_elearning`, each owned by its own user (`infra/compose/postgres-init/`). The e-learning database is migrated only by `elearning/backend/scripts/migrate.mjs`; the website's only by Payload migrations.

Deliberately unchanged:

- ~~The website stays **one deployable** (`website/app`), not a frontend/backend pair.~~ Reversed by the second amendment below.
- The CMS keeps its own host (`ADMIN_URL`, e.g. `cms.`), separate from the public site, so its login cookie never reaches public pages.

## Second amendment (2026-10-15): the website as a public frontend and a headless CMS

Leadership asked for the same shape in both products: a frontend and a backend. The first amendment kept the website as one deployable because Payload runs inside Next.js and splitting adds a network hop. That argument underrated two things: the public pages and the CMS already ran on separate hosts (rule above), and the split gives the public site no database access at all.

```text
website/frontend   @zgate/website-frontend   public site (www.), Next.js, no database
website/backend    @zgate/website-backend    Payload CMS, headless (cms.): admin, REST API,
                                             lead intake, lead inbox; the only database user
```

The seam, all server to server (visitors' browsers never call the CMS):

1. **Content:** the frontend reads published documents anonymously over the CMS's REST API, so the collections' "published only" read rules apply exactly as before. It holds no CMS or database credentials.
2. **Leads:** `POST /api/lead-intake` with a bearer token (`LEAD_INTAKE_TOKEN`). The frontend keeps the checks only it can make (honeypot, per-visitor rate limits: it sees the visitor's address). The CMS re-validates, enforces the privacy-notice and course rules, stores the lead and notifies staff. The leads collection still refuses creates over its REST API.
3. **Cache:** on publish, the CMS sends an HMAC-SHA256-signed webhook (`REVALIDATE_SECRET`, 5-minute replay window) to the frontend's `/api/revalidate`. Caddy doesn't route that path from the internet.
4. **Code:** the frontend may import only `@zgate/website-backend/contracts` (generated content types, lead schemas, division slugs, webhook signing). dependency-cruiser enforces this, keeps the contracts free of other CMS code, and keeps Payload's runtime out of the frontend. The rich-text React renderer, whose runtime imports only `react`, is the one Payload package the frontend uses.

Consequences:

- **Smaller blast radius:** a bug in the public site can't reach the database. It can only make anonymous CMS reads and token-guarded lead submissions.
- **Two deployables:** two images plus the migration image, always deployed at the same commit. Two shared secrets to rotate together (`docs/runbooks/WEBSITE_DEPLOY.md`).
- **A runtime dependency:** pages not yet cached, and form submissions, need the CMS up. Cached pages keep serving if it's down, and the frontend's `/api/ready` reports the CMS's state.
- **Cache-clearing is now a network call:** a lost webhook leaves pages stale until the hourly revalidation. Both sides log failures.
- **Site settings' staff inbox address** (`leadNotificationEmail`) became staff-readable only, since the frontend now reads settings over the public REST API.
