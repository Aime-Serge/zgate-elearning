# Z-GATE Digital Platform — Frontend Security

Applies `docs/security/SECURITY_REQUIREMENTS.md`, `RBAC_SECURITY_MODEL.md`, and `THREAT_MODEL.md` to frontend-specific concerns. **This document does not define any new security control** — the frontend has no authority to grant or deny access to anything; every control that actually matters lives server-side. What follows is how the frontend behaves correctly *within* that reality.

## The rule this entire document exists to enforce

**Client-side authorization is never a security control on this platform.** Hiding a button, redirecting away from a route the current role shouldn't see, or graying out a menu item are all legitimate *UX* decisions — they make the interface make sense to the person using it. None of them are what stops a malicious or misconfigured client from doing something it shouldn't. That job belongs entirely to the backend, on every single request, per `docs/security/THREAT_MODEL.md`'s Critical-rated finding on broken object-level authorization and role escalation.

**Concretely:**
- The route-level redirect described in `ROUTE_MAP.md` (`/portal` vs `/staff/*` by role) is implemented for navigation clarity. If a `client`-role user's browser is manipulated to request a `/staff/clients` page directly, the page may render its shell, but **every API call it makes still gets rejected server-side** — the frontend redirect is not what protects that data, the API's own role/ownership check is.
- A "mark complete" button hidden from a `client`-role view is a UX nicety. If that role somehow triggers the underlying API call anyway, the backend rejects it independent of whether the button was ever visible.
- Nothing in this frontend architecture ever trusts a role, permission flag, or ownership claim that arrived from the client itself (a URL parameter, a hidden form field, a client-stored value) as the basis for showing sensitive data — every render of Confidential data (`docs/database/DATA_SECURITY.md`'s classification) is only possible because the API already decided, server-side, that this session is allowed to see it, and returned it. The frontend displays what it was given; it does not decide what it's given.

## Session/authentication handling

- Session tokens are stored in an **httpOnly, Secure, SameSite cookie** — never in `localStorage` or `sessionStorage`. This directly closes `docs/security/THREAT_MODEL.md` §5's session-hijacking-via-XSS concern: JavaScript (including a successful XSS payload) cannot read an httpOnly cookie, so a stored-XSS bug can't trivially exfiltrate a session token the way it could from `localStorage`.
- The frontend never constructs or inspects the session token's contents — it's an opaque credential the browser sends automatically; the backend is the only party that interprets it (`docs/architecture/ADR/ADR-005-self-hosted-auth.md`).
- Logout clears the session server-side (`docs/architecture/API_ARCHITECTURE.md`'s `/api/auth/*` group) — the frontend's logout action calls that endpoint and clears local UI state, it doesn't just "forget" a token client-side and consider the job done.

## CSRF

Since authentication uses cookies (not a client-held bearer token sent manually per request), CSRF is a real, relevant threat class the frontend architecture must account for: state-changing requests (mark-complete, upload, convert-lead) use a CSRF-protection mechanism appropriate to the eventual backend framework (a synchronizer token or `SameSite=Strict/Lax` cookie policy plus origin checking) — the specific mechanism is a `docs(backend)` decision, but the frontend's job is to always include whatever token/header that mechanism requires, never to bypass it "for convenience."

## XSS prevention

- React escapes rendered content by default — `dangerouslySetInnerHTML` is not used anywhere in this codebase's plan. If a future genuine need arises (none is identified in any current backlog feature), it requires sanitization (e.g., DOMPurify) and a specific, reviewed justification, not a default tool.
- User- and staff-supplied content rendered anywhere (a lead's stated need, a deliverable's filename) relies on React's default escaping — directly closes `docs/security/THREAT_MODEL.md` §5's stored-XSS concern for the Client Portal.

## Content Security Policy & security headers

- A CSP is set (via Next.js's header configuration) restricting script/style sources to the application's own origin plus the specific, named font/asset origins already approved for this project (Google Fonts, per the Brand Identity Guide's existing use — matching the CDN allowlist discipline already established for this kind of work) — no wildcard script-src.
- Standard security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options`/frame-ancestors, `Referrer-Policy`) are set platform-wide, operationalizing `docs/security/SECURITY_REQUIREMENTS.md` V14's "security headers set appropriately" requirement at the frontend layer specifically.

## No secrets in the frontend bundle

- Only genuinely public configuration (e.g., the public API base URL) is ever exposed to client-side code (Next.js's `NEXT_PUBLIC_*` environment-variable convention makes this an explicit, deliberate opt-in, not an accident). No API key, database credential, or session secret is ever referenced from client-rendered code — those stay server-side, consistent with `.env.example`'s existing separation (`docs/devops/DEVELOPMENT_ENVIRONMENT.md`).

## Dependency security

- The frontend's dependencies are covered by the same CI security-scan job already established in the devops phase (`npm audit`, `gitleaks` — `.github/workflows/ci.yml`) — no separate frontend-specific scanning pipeline is introduced; the existing one already covers this codebase's entire dependency tree once the frontend package is added to it.

## What this document does not do

It does not implement the actual auth middleware, CSP header configuration, or CSRF token mechanism — those are implementation-phase work, built to satisfy the rules above. It does not weaken or restate `docs/security/RBAC_SECURITY_MODEL.md`'s actual permission matrix — that model's enforcement point remains entirely server-side, as it already specifies.
