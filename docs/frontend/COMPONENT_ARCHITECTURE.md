# Z-GATE Digital Platform — Component Architecture

## Three layers, each with one job

```
components/ui/         primitives - implement docs/design/COMPONENT_SPECIFICATION.md 1:1
components/features/   composed, feature-specific - assemble primitives, still no business logic
app/**/page.tsx         routes - fetch data, pass it down, own the "what happens when this loads"
```

### `components/ui/` — design-system primitives

One component per entry in `docs/design/COMPONENT_SPECIFICATION.md`: `Button`, `Link`, `Input`/`Textarea`/`Select`, `Card`, `Table`, `Badge`, `Alert`, `Modal`, `Nav`, plus `EmptyState`, `LoadingSkeleton`, `ErrorState`, `SuccessMessage`. Each:
- Takes props, renders markup and the design tokens' styling — **nothing else**. No data fetching, no `fetch()` calls, no knowledge of what a "Client" or "Lead" is.
- Is used identically on the public website and every portal — a `Button` on the Contact form and a `Button` on the Staff Portal's "mark complete" action are the same component, not two look-alikes. This is the concrete meaning of "prefer reusable components, avoid duplicated components" for this codebase.
- Implements the states `docs/design/COMPONENT_SPECIFICATION.md` already specified (loading, error, empty, disabled, etc.) as props, not as separate components (`<Button loading>`, not `<LoadingButton>`).

**Rule: before creating any new UI element, check `components/ui/` first.** A "one-off" styled variant of an existing primitive (a slightly different button for one screen) is exactly the duplication this phase is asked to avoid — extend the primitive's props instead.

### `components/features/` — composed, still no business logic

Examples: `ClientList` (composes `Table` + `Badge`), `ComplianceStatusCard` (composes `Card` + `Alert`), `LeadForm` (composes `Input`/`Select`/`Button` with `react-hook-form`, see `STATE_MANAGEMENT.md`).

**"No business logic inside presentation" — what that actually means here:**
- A feature component receives already-computed, display-ready data as props (e.g., `isOverdue: boolean`, already computed once — not `dueDate` with five different components each re-implementing the overdue comparison). The single shared computation lives in `lib/compliance.ts`, matching `docs/database/DATA_LIFECYCLES.md`'s "overdue is derived, not stored" decision — derived **once**, in one place, not duplicated across components.
- A feature component never decides *authorization* ("should this user see the mark-complete button") based on data it independently inspects — the page/route layer passes down only what the already-authorized API response contained, and any role-based UI hiding is a display convenience computed from the session role passed as a prop, not a re-derivation of business rules (see `FRONTEND_SECURITY.md` for why this distinction matters).
- Validation rules live in shared Zod schemas (`lib/validation/`), imported by both the form component and, ideally, mirrored server-side — not hand-written inline in a component's `onSubmit`.

### `app/**/page.tsx` — routes own data fetching and orchestration

Each route:
- Fetches data (Server Component `fetch` for public pages, a TanStack Query hook for portal pages — `STATE_MANAGEMENT.md`).
- Handles the loading/error/empty/success states by rendering the matching `components/ui/` state component — the route decides *which* state applies, the `ui/` component decides *how it looks*.
- Passes already-shaped data down to `features/` components as props — a feature component should be testable by passing in plain props, with no mock API needed to render it.

## Component reuse across surfaces — a concrete example

`Table` (one `components/ui/Table`) is used by: the Staff Portal's client list (FEAT-06.1), lead list (FEAT-03.1), the Client Portal's deliverables list (FEAT-05.2), and the future Admin user list (FEAT-09.1, V1) — four different data shapes, one component, because `docs/design/COMPONENT_SPECIFICATION.md`'s Table spec was written generically (header row, rows, optional row actions, responsive stacked-card collapse) rather than per-screen. Building `ClientTable`, `LeadTable`, `DeliverablesTable` as separately-styled components would be the duplication this architecture explicitly avoids.

## Naming and organization conventions

- `components/ui/` files are named for what they are (`Badge.tsx`), not what they're used for (`StatusBadge.tsx`) — reinforces that they're generic primitives, not screen-specific.
- `components/features/` files are named for the business concept they compose (`ComplianceStatusCard.tsx`), since they *are* screen/feature-specific by design.
- Every `components/ui/` primitive gets an accompanying test (`FRONTEND_TESTING.md`) verifying its states and accessibility properties — once, centrally — rather than re-testing "does this look right" on every screen that uses it.

## What this document does not do

It does not write the actual component code or exact prop-type signatures — implementation-phase work, built against `docs/design/COMPONENT_SPECIFICATION.md`'s already-approved anatomy/states/variants for each component. It does not introduce a component library beyond what's already justified (`FRONTEND_ARCHITECTURE.md`'s styling-approach section) — no separate icon-component-library dependency is named here; `docs/design/DESIGN_SYSTEM.md`'s icon guidance (style, weight, color) is implemented as needed, not pre-selected from a vendor.
