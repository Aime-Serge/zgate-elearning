# Z-GATE Digital Platform — Security Requirements

Organized by OWASP ASVS chapter. **Baseline (ASVS L1)** applies platform-wide. **Elevated (ASVS L2)** applies specifically to `identity`, `clients`, `advisory`, and `documents` — the modules handling Confidential-classified financial/personal data (`docs/architecture/DATA_ARCHITECTURE.md`). Every requirement traces to a threat in `THREAT_MODEL.md` or a commitment already made in `docs/business/BUSINESS_RULES.md`.

## V1 — Architecture, Design and Threat Modeling

- **[L1]** Security requirements are defined before implementation (this document) — not retrofitted.
- **[L1]** Trust boundaries are explicit (`SECURITY_ARCHITECTURE.md`) and every cross-boundary call is authenticated/authorized.
- **[L2]** Confidential-data-handling modules (`advisory`, `clients`, `identity`, `documents`) undergo a design review against this document before implementation begins, not only after.

## V2 — Authentication

- **[L1]** Passwords hashed with a modern, slow hashing algorithm (e.g., Argon2 or bcrypt) — never reversible encryption, never plaintext, never a fast general-purpose hash (MD5/SHA family alone).
- **[L1]** No maximum password length that would block a strong passphrase; minimum length enforced.
- **[L1]** Login failure messages never reveal whether the email or the password was wrong (`docs/architecture/API_ARCHITECTURE.md`'s error convention, `docs/product/ACCEPTANCE_CRITERIA.md` ST-06).
- **[L1]** Rate limiting / progressive backoff on login attempts (`THREAT_MODEL.md` §3).
- **[L2]** Multi-factor authentication available for staff accounts, required for any Admin-role account (V1) — operationalizes the Data Privacy Policy's existing "MFA where supported" commitment (§7) for the highest-blast-radius accounts identified in `THREAT_MODEL.md`'s risk summary.
- **[L1]** Password reset flow never confirms account existence via a distinguishable response; reset tokens are single-use and time-limited.

## V3 — Session Management

- **[L1]** Session tokens are cryptographically random, sufficiently long, and regenerated on login (prevents session fixation).
- **[L1]** Sessions expire after a reasonable inactivity period — balanced against the mobile, quick-check usage pattern (`docs/ux/USER_JOURNEY_MAP.md` Journey 7) so legitimate users aren't logged out mid-check, but not indefinite.
- **[L1]** Logout invalidates the session server-side, not just client-side token deletion.
- **[L2]** Session cookies (if used) set `Secure`, `HttpOnly`, and `SameSite` attributes.

## V4 — Access Control

- **[L1]** Every request enforces authorization server-side at the owning module's boundary (`docs/architecture/MODULE_ARCHITECTURE.md`) — never client-side-only or trust-the-request-payload checks.
- **[L1]** Object-level authorization checked on every resource access, not just endpoint-level role checks — directly answers `THREAT_MODEL.md` §2's Critical-rated Broken Object Level Authorization threat.
- **[L2]** Role is server-authoritative and immutable by the caller — a client-role account can never elevate itself, and this is verified by a specific test case (`SECURITY_TESTING_STRATEGY.md`), not assumed.
- **[L1]** Division-scoped access for staff enforced per `docs/business/ROLE_MATRIX.md` §4's access matrix — an Advisory Associate account cannot query Academy learner records, even if no UI currently exposes a path to try.

## V5 — Validation, Sanitization and Encoding

- **[L1]** All user input validated server-side (never client-validation-only) — type, length, format.
- **[L1]** Parameterized queries / an ORM's safe query interface used exclusively — no string-concatenated SQL, anywhere, ever.
- **[L1]** Output encoding applied wherever user- or staff-supplied content is rendered (deliverable filenames, lead-submitted text) to prevent stored XSS (`THREAT_MODEL.md` §5).
- **[L1]** File upload validation: type, size limits, no execution of uploaded content (`THREAT_MODEL.md` §7).

## V6 — Stored Cryptography

- **[L2]** Confidential-classified data (TIN, financial records, contact details) encrypted at rest — see `DATA_PROTECTION_REQUIREMENTS.md`.
- **[L1]** No custom-built cryptographic primitives — standard, well-reviewed libraries only (ADR-005 explicitly notes this constraint on the self-hosted auth decision).
- **[L1]** Encryption keys never stored alongside the data they protect, never committed to version control.

## V7 — Error Handling and Logging

- **[L1]** No stack traces, internal error details, or technical messages reach the end user (`docs/architecture/API_ARCHITECTURE.md`'s error convention — this is a security requirement as much as a UX/brand-voice one).
- **[L1]** Security-relevant events logged: authentication attempts (success and failure), authorization failures, access to Confidential-classified records (`docs/architecture/DATA_ARCHITECTURE.md`'s `access_log`).
- **[L1]** Logs never contain plaintext passwords, full credit-card-style financial identifiers, or other Confidential field values in cleartext — log *that* an access happened, not the sensitive payload itself.

## V8 — Data Protection

- Fully specified in `DATA_PROTECTION_REQUIREMENTS.md` — summarized here: data classified per the Data Privacy Policy's own scheme, Confidential data encrypted in transit and at rest, retention/deletion tied to the (currently unconfirmed) statutory period, dev/staging never holds real Client data.

## V9 — Communications

- **[L1]** TLS enforced on every connection, no unencrypted HTTP endpoint anywhere, including internal health checks if externally reachable.
- **[L1]** TLS certificate validity monitored — an expired certificate on a compliance-critical portal is a real, avoidable trust failure for a brand-new company (`docs/marketing/MARKETING_STRATEGY.md` proof strategy).

## V10 — Malicious Code

- **[L1]** Dependency/software-composition-analysis (SCA) scanning in CI once implementation begins (`SECURITY_TESTING_STRATEGY.md`) — catches known-vulnerable packages before they reach production.
- **[L1]** No unreviewed third-party code with broad system access — any library added to the dependency tree is a deliberate choice, not an unreviewed transitive default.

## V11 — Business Logic

- **[L2]** Business-rule-critical actions (marking a filing complete, issuing a certificate) are validated server-side against the actual state, not just accepted because the client claims a precondition is met — e.g., the server itself checks the compliance item exists and belongs to the caller's assigned engagement before recording completion.
- **[L1]** Rate/abuse limits on business-logic-sensitive actions (repeated lead submissions, repeated login attempts) as already covered in V2/API sections.

## V12 — Files and Resources

- **[L1]** Uploaded files stored outside the application's executable path; never served with execute permissions.
- **[L2]** File access mediated entirely through application-layer authorization — no direct, guessable, or public storage URL for Confidential documents (`THREAT_MODEL.md` §7).

## V13 — API

- **[L1]** Every API endpoint documented with its required role/ownership check (traceable back to `docs/architecture/API_ARCHITECTURE.md`'s endpoint groups) — no endpoint exists without an explicit, reviewed authorization rule.
- **[L1]** Consistent, structured error responses (already specified architecturally) that don't leak implementation details.

## V14 — Configuration

- **[L1]** No default credentials anywhere (database, admin accounts, third-party service accounts).
- **[L1]** Production configuration (secrets, connection strings) never committed to version control — managed through an access-controlled secrets mechanism (Data Privacy Policy Annex C, already committed).
- **[L1]** Security headers set appropriately (e.g., preventing clickjacking, MIME-sniffing) on every response.
- **[L1]** Dev/staging/production environment separation enforced at the configuration level, not just by convention (`docs/architecture/DEPLOYMENT_ARCHITECTURE.md`).

## What this document does not do

It does not claim ASVS certification — that requires formal verification against a real, built system. It does not specify exact library/tool choices (a specific hashing library, a specific secrets manager) — those are implementation decisions made within these requirements, not this document's call.
