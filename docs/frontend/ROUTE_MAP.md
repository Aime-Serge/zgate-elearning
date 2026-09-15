# Z-GATE Digital Platform — Route Map

Next.js App Router paths for every page in `docs/ux/INFORMATION_ARCHITECTURE.md` and `docs/design/PAGE_SPECIFICATIONS.md`, phase-tagged per `docs/product/PRODUCT_ROADMAP.md`. Route groups (`(public)`, `(portal)`, `(admin)`) don't appear in the URL — they exist only to apply different layouts/auth requirements per surface.

## `(public)` — no authentication [MVP]

| Route | Page | Rendering | Backlog feature |
|---|---|---|---|
| `/` | Home | Static (SSG) | FEAT-01.1 |
| `/advisory` | Advisory division page | Static (SSG) | FEAT-01.1 |
| `/academy` | Academy division page | Static (SSG) | FEAT-01.1; enrollment CTA activates at V1 |
| `/tech` | Tech division page | Static (SSG) | FEAT-01.1 |
| `/data` | Data division page | Static (SSG) | FEAT-01.1 |
| `/contact` | Contact + lead form | Static shell, client-side form submission | FEAT-01.2, FEAT-02.1 |

**Rendering choice:** static generation (SSG), not per-request SSR — this content changes rarely (it's the approved brand/division copy, not dynamic data), so pre-rendering at build time gives the best possible performance on the slow mobile connections `docs/marketing/SEO_STRATEGY.md` and `docs/ux/EXPERIENCE_REQUIREMENTS.md` §1 both prioritize, with no server round-trip needed per visit.

## `(portal)` — authenticated, `client` or `staff_*` role [MVP: Status/Deliverables/Clients/Leads/Reporting]

| Route | Page | Role | Rendering | Backlog feature |
|---|---|---|---|---|
| `/login` | Login | none (redirects if already authenticated) | Client Component (form) | FEAT-04.1/04.2 |
| `/portal` | Client status (default landing for `client` role) | `client` | Client Component (TanStack Query) | FEAT-05.1 |
| `/portal/deliverables` | Deliverables list | `client` | Client Component | FEAT-05.2 |
| `/staff/clients` | Client list | `staff_advisory` | Client Component | FEAT-06.1 |
| `/staff/clients/[id]` | Client detail — mark complete, upload | `staff_advisory` | Client Component | FEAT-06.2, FEAT-06.3 |
| `/staff/leads` | Lead list, manual entry, convert | `staff_marketing`, `staff_advisory` (convert only) | Client Component | FEAT-03.1, FEAT-02.2, FEAT-03.2 |
| `/staff/reporting` | Internal reporting | `staff_advisory` (own numbers), `admin` (full) | Client Component | FEAT-07.1, FEAT-07.2 |

**Why these are Client Components, not Server Components:** these screens are interactive, frequently-revalidated, session-scoped views (mark an item complete and see the list update, filter a lead list) — exactly what `docs/architecture/MODULE_ARCHITECTURE.md` called "client-rendering acceptable for authenticated portals." Server Components would still work but would mean a full server round-trip for every filter/sort interaction, which doesn't serve the mobile, quick-check usage pattern `docs/ux/USER_JOURNEY_MAP.md` Journey 7 describes.

**Role-based redirect:** `/portal` and `/staff/*` are two different landing areas under one route group because the *layout and navigation* differ by role (`docs/design/PAGE_SPECIFICATIONS.md`'s Client Portal vs. Staff Portal), not because the authentication mechanism differs — one login, one session, role determines which sub-tree renders. **This redirect is a UX convenience, not a security boundary** — see `FRONTEND_SECURITY.md`.

## `(portal)` — V1 additions

| Route | Page | Role | Backlog feature |
|---|---|---|---|
| `/academy` (public preview) + `/academy/enroll` | Enrollment | none → `client`/new record | FEAT-08.1, FEAT-08.2 |
| `/staff/academy` | Cohort/attendance/assessment management | `staff_academy` | FEAT-08.2–08.4 |

## `(admin)` — authenticated, `admin` role only [V1]

| Route | Page | Backlog feature |
|---|---|---|
| `/admin/users` | User list, add/deactivate | FEAT-09.1, FEAT-09.2 |

## V2 additions (routed when their module ships, not before)

| Route | Page | Backlog feature |
|---|---|---|
| `/staff/tech` | Ticket/uptime management | FEAT-10.1, FEAT-10.2 |
| `/staff/data` | External Data client report management | FEAT-11.1 |
| `/admin/access-review` | Quarterly access review | FEAT-12.2 |
| `/portal/tech`, `/portal/data` | Multi-division Client Portal expansion | Eric persona journey, `docs/ux/USER_JOURNEY_MAP.md` Journey 5 |

## What this document does not do

It does not route anything not already in an approved backlog feature — no `/portal/billing`, no AI-related route, no route for a role that doesn't exist yet (Service Delivery Lead, Division Manager, DPO), consistent with `docs/product/PERSONAS.md`'s explicit "don't build screens for roles nobody occupies" rule.
