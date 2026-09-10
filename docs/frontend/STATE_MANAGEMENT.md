# Z-GATE Digital Platform — State Management, Data Fetching, Forms & Validation

## No global client-state library

Redux, Zustand, MobX, Jotai — none are used. **Why:** every screen's real state need, reviewed against the actual MVP backlog (`docs/product/PRODUCT_BACKLOG.md`), decomposes into one of three kinds, each with a purpose-built, smaller tool below. No feature anywhere in `docs/product/` needs state shared across unrelated parts of the app the way a global store exists to solve — introducing one now would be exactly the "unnecessary dependency" this phase is asked to avoid.

## Server state: TanStack Query (portal/staff screens), Server Components (public pages)

- **Public website pages** fetch data server-side (Next.js Server Components, `fetch` at request/build time) — no client-side data-fetching library needed for largely-static content (`ROUTE_MAP.md`'s SSG rendering choice).
- **Portal/Staff/Admin screens** use TanStack Query (React Query) for every API call. **Justification, not default reach-for-it:** these screens have real, recurring needs TanStack Query solves cleanly — caching (don't refetch the client list on every tab switch), automatic revalidation after a mutation (marking a compliance item complete should update the list without a manual refresh), and built-in loading/error states that map directly onto `docs/design/COMPONENT_SPECIFICATION.md`'s Loading/Error state components. Hand-rolling this with `useState`/`useEffect` per screen would mean reimplementing the same caching/revalidation logic repeatedly — more code, not less, and a worse fit for "prefer reusable" than one well-used library.

## Local UI state: React's built-in `useState`/`useReducer`

Anything that doesn't need to survive a navigation or be shared outside one component tree (a modal's open/closed state, a form's current step) uses plain React state — no library needed for this, and reaching for one would be over-engineering a problem React already solves.

## Form strategy: React Hook Form + Zod

- **React Hook Form** manages form state (field values, touched/dirty tracking, submission state) for every form in the platform: the public lead-capture form (FEAT-01.2/02.1), Academy enrollment (FEAT-08.2, V1), and every staff data-entry form (mark-complete confirmation, deliverable upload, manual lead entry).
- **Zod** defines validation schemas, one per form, colocated in `lib/validation/`. **Why Zod specifically:** TypeScript-native (infers static types from the schema, so the form's TypeScript types and its validation rules can never silently drift apart), and its schema-as-data shape means the same validation logic is easy to mirror on the backend once that framework is chosen (`docs(backend)`, the next phase) — reducing, not eliminating, duplicated validation logic between client and server.

## Validation — client validates for UX, server validates for real

**This is the single most important rule in this document, and it's stated in `FRONTEND_SECURITY.md` too because it matters that much:** client-side (Zod + React Hook Form) validation exists to give a user immediate, helpful feedback (`docs/design/COMPONENT_SPECIFICATION.md`'s Forms error-state spec) — it is never the system's actual defense against bad data. Every field is re-validated server-side on every request, per `docs/security/SECURITY_REQUIREMENTS.md` V5 ("all user input validated server-side... never client-validation-only"), regardless of what the client already checked. A malicious or buggy client that skips the frontend entirely and calls the API directly must be handled exactly as safely as one that used the form correctly.

## Error handling

| Layer | What happens |
|---|---|
| Field-level (form validation failure) | Inline error message next to the field, plain language (`docs/marketing/MESSAGING_FRAMEWORK.md`'s voice rule extends to interface copy) — e.g. "Enter a valid phone number," matching `docs/product/ACCEPTANCE_CRITERIA.md`'s existing example |
| Request-level (API call fails) | TanStack Query's error state renders `components/ui/ErrorState` — plain-language message, retry action where sensible, never a raw error/stack trace (`docs/architecture/API_ARCHITECTURE.md`'s error-response convention already keeps technical detail out of what the API even sends) |
| Unexpected/uncaught (a rendering error) | A route-level error boundary (Next.js's built-in `error.tsx`) catches it and shows a plain "something went wrong" state rather than a blank white screen or a raw stack trace in production |

## Loading states

- TanStack Query's `isLoading`/`isFetching` states drive `components/ui/LoadingSkeleton` (list/card content) or an inline spinner (button actions) — per `docs/design/COMPONENT_SPECIFICATION.md`'s timing rule: only shown for interactions expected to take > 300ms, to avoid flicker on fast responses.
- Public Server-Component pages use Next.js's `loading.tsx` convention (a route-level skeleton shown during server rendering) for the rare case a public page needs it — most public pages are static and don't.

## Session/auth state — deliberately minimal on the client

The frontend holds only what it needs to *render* correctly (the current user's role, for UI purposes like which nav items to show) — it never holds anything the client-side code treats as an authorization decision. Full reasoning and the session/cookie mechanism: `FRONTEND_SECURITY.md`.

## What this document does not do

It does not pick exact TanStack Query cache-time/stale-time values or React Hook Form configuration details — implementation-phase tuning. It does not design the backend's mirrored validation — that's `docs(backend)`'s job, informed by the same Zod-schema-sharing intent noted above.
