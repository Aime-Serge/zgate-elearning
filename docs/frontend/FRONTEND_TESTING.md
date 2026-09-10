# Z-GATE Digital Platform — Frontend Testing

## Tooling: Vitest + React Testing Library — no new test runner

Vitest is already established at the repository root (`docs/devops/DEVELOPMENT_ENVIRONMENT.md`) and verified working in CI. The frontend package adds **React Testing Library** on top of it — the standard, minimal pairing for testing React components by their rendered behavior rather than implementation detail. No separate test runner (Jest) is introduced; doing so would mean running two different test tools in one repository for no real benefit, directly against "avoid unnecessary dependencies."

## What gets tested, and at what layer

| Layer | What's tested | How |
|---|---|---|
| `components/ui/` primitives | Every state `docs/design/COMPONENT_SPECIFICATION.md` defines (default, hover/focus where testable, disabled, loading, error) renders correctly; accessibility properties (labels, roles, keyboard operability) | React Testing Library, querying by accessible role/label (not CSS selectors — a test that only passes because of a class name isn't testing what a user or screen reader actually experiences) |
| `components/features/` composed components | Behavior given props — e.g., `ComplianceStatusCard` shown a "due tomorrow" prop renders the Warning-toned treatment `docs/design/PAGE_SPECIFICATIONS.md` specifies | Plain props in, rendered output asserted — no real API call, no `lib/compliance.ts` reimplemented in the test (the "is this overdue" computation is tested once, at `lib/`, not re-verified in every component that displays it) |
| `lib/` shared logic (validation schemas, derived-state computations) | Pure function behavior — given these inputs, this output | Standard Vitest unit tests, no rendering involved |
| Forms | Validation errors show the right message for the right invalid input; a valid submission calls the expected handler | React Testing Library, simulating real user input (typing, blurring, submitting) rather than calling internal form-library APIs directly |
| Routes/pages | Loading → success and loading → error transitions render the right `components/ui/` state; a role-appropriate view renders its role-appropriate content | React Testing Library with a mocked API layer (TanStack Query's testing utilities) |

## Accessibility testing — automated, in CI

`docs/design/ACCESSIBILITY_SPECIFICATION.md` sets a WCAG 2.1 AA target. An automated accessibility checker (`axe-core`, run via its Vitest/RTL integration) runs against every `components/ui/` primitive and every page-level test — catching missing labels, insufficient contrast on rendered output, and incorrect ARIA usage automatically, in CI, on every pull request. This does **not** replace manual accessibility verification (real keyboard navigation, a real screen reader) before MVP ships — automated tooling catches a meaningful subset of WCAG issues, not all of them, and `docs/design/ACCESSIBILITY_SPECIFICATION.md` already says as much about certification claims generally.

## What's explicitly NOT built at MVP, and why

- **No end-to-end (E2E) browser-automation suite (Playwright/Cypress) at MVP.** Component + integration-level tests (React Testing Library, mocked API) cover the real regression risk at this scale — an actual MVP user base of a handful of Advisory clients and one staff account doesn't yet justify the maintenance cost of a full browser-automation suite. **Revisit at V1**, once the platform has enough real surface area (Academy, multi-role Staff Portal) that a true end-to-end smoke test of the critical path (login → view status → mark complete → client sees it) earns its keep. Flagged explicitly so it isn't silently forgotten, same discipline as `docs/security/SECURITY_TESTING_STRATEGY.md`'s deferred-penetration-test decision.
- **No visual regression testing tool** (Chromatic, Percheck, etc.) — `docs/design/DESIGN_SYSTEM.md`'s small, stable token set and the platform's early stage don't yet justify this; a design system this size can be reviewed by eye during PR review.
- **No snapshot-testing-everything default.** Snapshot tests are brittle and tend to be updated reflexively rather than reviewed — used sparingly, only where a genuinely large, stable output (e.g., a full page's rendered structure) benefits from one, not as the default test type for every component.

## Coverage expectation

No specific numeric coverage percentage is mandated — a 100%-coverage target on a small, early-stage frontend tends to produce tests written to hit the number, not tests that catch real regressions. Instead: every `components/ui/` primitive has at least one test per documented state, every `lib/` function with a business rule (validation, derived-state computation) has a test, and every form has a test for both its valid and its most important invalid path. This is the same proportionate, need-driven testing philosophy `docs/security/SECURITY_TESTING_STRATEGY.md` already applied to the backend.

## What this document does not do

It does not write the actual test files — implementation-phase work. It does not commit to a specific `axe-core` integration package or version — that's decided and verified working (same discipline as the devops phase: install for real, run it, confirm it passes, then commit) when the frontend package is actually scaffolded.
