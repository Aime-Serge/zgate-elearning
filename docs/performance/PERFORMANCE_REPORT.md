# Z-GATE Digital Platform — Performance Report

**Date:** 2026-09-11
**Scope:** The full implemented platform (public website + authenticated staff/client portals + API).
**Method:** Real measurement wherever this environment allows it — a genuine production build (`next build`, run via `.next/standalone/server.js`, the exact artifact `apps/web/Dockerfile`'s production target ships), real `curl` timing against it, and real inspection of the actual build output (bundle sizes, response headers). Where real measurement wasn't possible here, that's stated explicitly rather than inferred and presented as measured — see **Limitations**.

## Ground rule for this report

The brief for this phase is explicit: *do not optimize blindly, measure before and after, do not introduce expensive infrastructure without demonstrated need.* That governs everything below. Several things checked in this pass turned out to already be fine — those are reported as passes, not silently skipped, because "we checked and it's fine" is a real, useful performance-engineering result. One real, structural bottleneck was found and fixed, with a before/after. Two more real things were found and *not* fixed, with the reasoning for why written out rather than fixed reflexively.

## Limitations

No browser is available in this environment — there is no Lighthouse/Core Web Vitals run in this report, and "Core Web Vitals" and "mobile performance" below are reasoned from architecture and measured bundle/response data, not measured directly. No reachable PostgreSQL exists in this sandbox (the same constraint noted in every phase of this engagement, including `docs/qa/TEST_STRATEGY.md`) — "database queries" below is a structural/static review (indexes, query shape, N+1 patterns), not a live `EXPLAIN ANALYZE` against real data volume. Both limitations are stated at each relevant finding, not just here.

---

## Summary

| Area | Result |
|---|---|
| Page load (static pages) | **Pass** — 14–35ms server response after warm-up, measured against a real production build |
| Server response (dynamic route) | **Pass, with a noted one-time cost** — ~700ms first hit (Node/V8 warm-up), 65–160ms thereafter |
| API latency (routing/middleware layer) | **Pass** — 1.7–6ms |
| Database queries | **One real N+1 pattern found and fixed.** One real but currently-inconsequential indexing gap found and *not* fixed (reasoning below) |
| Bundle size | **Measured, one real cost identified and deliberately not changed** (reasoning below) |
| Image optimization | **N/A** — zero images anywhere in the codebase |
| Caching | **Pass** — already optimal out of the box |
| Rendering | **Pass** — correct use of Server Components throughout the public site |
| Core Web Vitals | **Not measured** (no browser) — reasoned qualitatively from the above |
| Mobile performance | **Not measured** (no device/network throttling available) — reasoned from bundle-size discipline |

---

## What was measured, and found to already be fine

### Static page response time

Against the real production build (`.next/standalone/server.js`, port 3003, the same artifact the Dockerfile's `prod` target runs):

```
/            first request: 309ms (cold), then: 32ms, 25ms, 14ms, 19ms
/academy:    35ms
```

The 309ms first-request figure is the process's own cold start (module loading, first-request JIT warm-up), not a per-request cost — every subsequent request to the same static route lands in the 14–35ms range. This is a fast, healthy number for server-rendered HTML and needs no work.

### Dynamic route response time

`/staff/clients/[id]` (the one route pattern in this app that's genuinely server-rendered per-request, not statically prerendered):

```
First hit: 707ms
Next 5:    160ms, 116ms, 77ms, 88ms, 65ms
```

Same shape as the static-page cold start — a one-time cost, not a sustained one. This page has no server-side data fetching of its own (it's a client-rendered shell that fetches via TanStack Query after hydration, per this engagement's established frontend pattern), so the ~65–160ms steady-state figure is essentially React's server-render cost for the page shell itself. Not a bottleneck; nothing to fix.

### API layer overhead (backend)

```
GET /api/health:       1.7–3.4ms (5 runs)
GET /api/auth/session:  2.0–5.9ms (5 runs)
```

Fastify's own routing/middleware/session-decode cost, independent of any database work (both of these either need no database at all or fail fast on the session check before ever reaching one). This is negligible — not a place to spend effort.

### Compression and caching headers

Checked directly against real response headers from the production build:

- **Gzip** is applied automatically to both HTML and JS responses (`Content-Encoding: gzip`) — confirmed on every response inspected.
- **Static assets** (JS chunks, self-hosted font files): `Cache-Control: public, max-age=31536000, immutable` — the correct, optimal header for content-hashed, never-changing files. Nothing to improve here; this is already the textbook-correct configuration, provided by Next.js's build pipeline without any manual header configuration needed.
- **Static pages**: served with `x-nextjs-cache: HIT` and `x-nextjs-prerender: 1` — confirming Next's own prerendering/caching is engaged correctly for every public marketing page, exactly as `docs/frontend/ROUTE_MAP.md`'s SSG rendering choice intended.

No caching infrastructure (CDN, Redis, a reverse-proxy cache layer) is recommended. None of the above shows a gap a cache would close, and this platform doesn't have production traffic yet to demonstrate a need for one — adding one now would be exactly the "expensive infrastructure without demonstrated need" this phase's brief warns against.

### Font loading

`next/font/google` self-hosts font files at build time — confirmed by inspecting the actual response: font requests resolve to `/_next/static/media/*.woff2` (this app's own origin), never `fonts.gstatic.com`. Each font file is small (4–84KB per weight/subset) and `<link rel="preload">`'d directly in the HTML `<head>` — no render-blocking external font fetch, no flash-of-invisible-text risk from a slow third-party font host. Nothing to change.

### Code-splitting

Checked directly: does a page with no forms load the same JS as a page with a form? No — confirmed the homepage (`/`, no forms) does not reference the chunk containing `react-hook-form`/`zod`, while `/login` and `/contact` (both have forms) do. Next.js's automatic per-route code-splitting is working correctly; users browsing the public marketing pages never pay for form-validation JS they don't use.

### Image optimization

**N/A.** There are zero image files anywhere in this codebase (`find . -iname "*.png" -o -iname "*.jpg" -o ...` returns nothing outside `node_modules`/`.next`). The one visual mark (`GateMark`) is a hand-coded inline SVG component, not an image asset. There is nothing to optimize, and no `next/image` pipeline, CDN-based image service, or WebP conversion step is worth building for a platform with no images to serve.

### Rendering strategy

Every public marketing page (`/`, `/about`, `/advisory`, `/academy`, `/tech`, `/data`) is a Server Component by default (no `"use client"` directive) — confirmed by inspecting each file directly. Client-side JS is reserved for genuinely interactive pieces (the mobile nav toggle, forms, authenticated dashboards) — exactly the split `docs/frontend/ROUTE_MAP.md` and `docs/architecture/MODULE_ARCHITECTURE.md` already called for. No page is paying for client-side rendering it doesn't need.

---

## What was found and fixed

### N+1 audit-log inserts on `GET /api/clients`

**Bottleneck:** `src/modules/clients/routes.ts`'s staff client-list endpoint looped over every client in the response and `await`ed one `INSERT INTO access_log` per client, sequentially:

```ts
for (const client of clients) {
  await logAccess(db, { userId: user.userId, action: "view_client_list", ... });
}
```

This is a textbook N+1 pattern: an endpoint that should cost 2 database round trips (fetch the list, write the audit log) instead costs `1 + N`, where N is the number of clients returned — each awaited one at a time, not even in parallel. At today's real data volume (`docs/business/BUSINESS_REQUIREMENTS.md`'s own target: single-digit-to-low-double-digit clients by Day 90) the practical cost is small, but this is a staff-facing page visited daily, and the pattern scales linearly with the one number (client count) this whole platform exists to grow — exactly the kind of defect worth catching by inspection before it's ever large enough to be *felt*, not after.

**Fix:** added `logAccessMany` to `src/lib/audit.ts` — a single multi-row `INSERT` for a batch of audit entries — and switched the route to build the full list of entries and call it once:

```ts
await logAccessMany(db, clients.map((client) => ({ userId: user.userId, action: "view_client_list", ... })));
```

**Before / after (structural, not a live timing run — no reachable database to run one against in this sandbox):** before, N clients meant N sequential awaited round trips; after, any N means exactly one. This is a structural before/after, not a stopwatch one — the claim is about query *count*, which doesn't need a live database to verify, only correct code. The *externally observable behavior is identical* (each client still gets exactly one `access_log` row) — the existing test (`clients/routes.test.ts`, asserting an audit row exists per listed client) continues to pass unchanged, confirming the fix didn't alter behavior, only how it's achieved.

**Verification:** full backend test suite re-run clean (91/91) after the change; typecheck and lint clean.

---

## What was found and deliberately *not* fixed

### Forms bundle (~100KB gzipped: zod + react-hook-form + this app's schemas)

**Measurement:** the largest single JS chunk in the production build is 423KB uncompressed / **~100KB gzipped over the wire** (measured directly via `curl -H "Accept-Encoding: gzip"`), containing `react-hook-form`, `zod`, and this app's own Zod schema definitions (`apps/web/src/lib/schema.ts`). It loads only on the ~8 pages that actually use a form (confirmed under Code-splitting, above) and is cached with `immutable, max-age=31536000` after the first load, so a user navigating between form pages downloads it once, not per page.

**Why this isn't being changed:** 100KB gzipped, loaded once and cached, is a real but proportionate cost for what it buys — every form on this platform validates client-side *and* server-side from the same schema shape, by design (`docs/frontend/STATE_MANAGEMENT.md`: "client validates for UX, server validates for real"), which is a genuine correctness and security property, not decoration. There is no measured Core Web Vitals failure or user-facing symptom driving a change here — only a number that, on its own, sounds larger than it functionally is. Swapping validation libraries, hand-rolling validation, or introducing lazy-loading complexity to shave this down would be optimizing a number instead of a demonstrated problem — precisely what this phase's brief says not to do. If a real Core Web Vitals measurement (once a browser/Lighthouse is available, or once this ships and real field data exists) shows this actually costing something on a real device, that's the trigger to revisit it — not this report.

### `compliance_items` has no full index on `engagement_id`

**Finding:** `db/migrations/005_compliance_items.sql` defines one index: `compliance_items_pending_due_date_idx ON compliance_items (engagement_id, due_date) WHERE completed_at IS NULL` — a *partial* index, covering only uncompleted items. `getComplianceItemsForClient` (the client portal's status view, and the same query shape Advisory's own compliance list uses) fetches items *regardless* of completion status, a query shape the partial index doesn't fully cover.

**Why this isn't being changed:** `compliance_items` is one of the smallest, slowest-growing tables in the schema by design — a handful of rows per client per month (`docs/business/BUSINESS_REQUIREMENTS.md`'s own MVP scale target). PostgreSQL sequentially scans a table of this size in a fraction of a millisecond regardless of indexing; there is no reachable database in this sandbox to prove that number, but there's also no plausible data volume in this platform's near-term future where it would matter enough to measure. Adding an index "just in case" for a table that won't have enough rows to need one for a long time is exactly the premature optimization this phase's brief rules out. **Revisit if:** `compliance_items` ever reaches a row count in the thousands *per engagement* (not platform-wide) — nothing in this business's current or projected scale points toward that.

---

## Core Web Vitals and mobile performance (reasoned, not measured)

No browser is available in this environment, so no Lighthouse run, no real Largest Contentful Paint/Interaction to Next Paint/Cumulative Layout Shift number exists for this report to cite — stating otherwise would be exactly the "blind" behavior this phase's brief warns against. What can be said, reasoned from what *is* measured above:

- **LCP:** likely good — static pages are prerendered HTML (no client-side render required for first paint), fonts are self-hosted and preloaded (no third-party font-host round trip blocking text render), and there are no images to be the LCP element in the first place.
- **CLS:** no obvious layout-shift risk identified — no images (a common CLS cause when unsized), fonts loaded via `next/font` (which reserves layout space and matches fallback-font metrics automatically, Next's own built-in CLS mitigation).
- **INP:** not reasoned about with confidence — this depends on real interaction timing this environment can't produce.
- **Mobile performance:** the codebase's own responsive-design discipline (verified in `docs/qa/TEST_RESULTS.md`, mobile-first CSS throughout) plus the small, code-split JS payloads measured above are favorable signals, not a measurement. `docs/design/DESIGN_SYSTEM.md` frames mobile as this platform's primary usage pattern ("88.7% of the market is mobile-connected") — worth a real Lighthouse/field-data run the first time a browser is available, given how much that document leans on it.

**Recommendation, not an action taken in this report:** run a real Lighthouse/Core Web Vitals pass (CI-based, e.g. `lighthouse-ci`, or a one-off manual run) once this ships somewhere with a browser reachable — not before, and not simulated here.

## Not tested this phase (cross-referenced, not re-litigated)

Browser compatibility is out of scope here — see `docs/qa/DEFECTS.md` G-03, which already tracks it as a coverage gap. This report doesn't duplicate that finding.

## What this report explicitly does not recommend

No CDN, no Redis or other cache layer, no image-optimization pipeline, no service worker, no additional code-splitting tooling beyond what Next.js already does automatically, no load-testing/APM platform. None of these has a demonstrated need at this platform's current, measured scale — adding any of them now would be the "expensive infrastructure without demonstrated need" this phase's brief explicitly rules out.
