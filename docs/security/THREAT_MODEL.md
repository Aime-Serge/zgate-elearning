# Z-GATE Digital Platform — Threat Model

Architecture-level threat modeling against a system that does not exist yet (no code has been written — `docs/discovery/CURRENT_FUNCTIONALITY.md`). **No destructive or intrusive testing was performed to produce this document** — every entry below is analytical, derived from `docs/architecture/` and `docs/business/BUSINESS_RULES.md`'s data-privacy commitments, using STRIDE (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege) as the working framework.

**Risk classification method:** rated by *impact* (given the data/asset's real sensitivity, per `docs/architecture/DATA_ARCHITECTURE.md`'s classification) × *likelihood* (given the platform's actual current exposure — pre-launch, small user base, no attacker interest demonstrated yet, but a real public internet presence once live). Where likelihood is currently low simply because nothing is deployed, that's noted — it is not a reason to rate a high-impact threat as low-risk once the system goes live.

---

## 1. Public website

| Threat (STRIDE) | Description | Attack surface | Controls | Risk |
|---|---|---|---|---|
| Tampering / Defacement | Unauthorized content modification | CMS/deploy pipeline, if compromised | Deploy credentials restricted, no public write access, static/server-rendered content with no user-generated public content at MVP | **Medium** — reputational, not data-exposing (no Confidential data on this surface per `DATA_ARCHITECTURE.md`) |
| Spoofing | Phishing site impersonating Z-GATE | Domain/DNS | Requires the still-unresolved domain decision (`docs/discovery/OPEN_QUESTIONS.md` #1) to be locked down with proper DNS/registrar security once chosen | **Medium** — real reputational risk for a trust-dependent brand-new company (`docs/marketing/MARKETING_STRATEGY.md` proof strategy) |
| DoS | Volumetric or form-spam abuse of the public lead-capture form | `/api/public/contact` (unauthenticated) | Rate limiting (`docs/architecture/API_ARCHITECTURE.md`), basic bot mitigation | **Low** — low current profile, cheap to mitigate |

## 2. APIs

| Threat | Description | Attack surface | Controls | Risk |
|---|---|---|---|---|
| Broken Object Level Authorization (OWASP API1) | A client-role caller supplies another client's ID and receives their data | Any `/api/clients/*`, `/api/advisory/*` endpoint | Every endpoint checks ownership server-side, never trusts a client-supplied ID alone (`docs/architecture/API_ARCHITECTURE.md`) | **Critical** if a control gap exists — this is the single most damaging realistic failure mode for this business (cross-client data exposure would collapse the "trustworthy" positioning `docs/marketing/POSITIONING.md` depends on) |
| Injection | SQL/command injection via unvalidated input | Any endpoint accepting user input | Parameterized queries only, input validation (ASVS V5, `SECURITY_REQUIREMENTS.md`) | **High** if unmitigated, standard/well-controlled risk otherwise |
| Excessive data exposure | An endpoint returns more fields than the UI needs, leaking data to a client who shouldn't see it even if the UI doesn't render it | Any response payload | Explicit response shaping per endpoint, not "return the whole record" | **Medium** |

## 3. Authentication

| Threat | Description | Attack surface | Controls | Risk |
|---|---|---|---|---|
| Credential stuffing / brute force | Automated login attempts against staff or client accounts | `/api/auth/login` | Rate limiting, account lockout/backoff, no username enumeration in error messages (`docs/architecture/API_ARCHITECTURE.md`'s error-handling convention) | **High** — this is self-hosted auth (ADR-005), so the responsibility is entirely Z-GATE's; a compromised Advisory Associate account exposes every client's financial data |
| Weak password policy | Users choose easily-guessed passwords | Registration/password-set flow | Minimum password strength requirements, no maximum-length restriction that would block passphrases (ASVS V2) | **Medium** |
| Session fixation/hijacking | Attacker reuses or predicts a session token | Session/token issuance | Cryptographically random session tokens, regenerated on login, secure/httpOnly/sameSite cookie flags or equivalent | **High** |

## 4. Authorization

| Threat | Description | Attack surface | Controls | Risk |
|---|---|---|---|---|
| Privilege escalation | A staff account accesses another division's data it isn't scoped to | Any staff-facing endpoint | Division-scoped role checks per `docs/business/ROLE_MATRIX.md` §4, enforced at module boundary | **High** — directly violates the Data Privacy Policy's already-committed per-division access rule |
| Client-to-staff privilege escalation | A client-role account gains staff-level access | Auth/session layer | Role is server-assigned at account creation, never client-modifiable; role checked on every request, not just at login | **Critical** — would expose every client's data to any client |

## 5. Client Portal

| Threat | Description | Attack surface | Controls | Risk |
|---|---|---|---|---|
| Cross-client data leakage | See "Authorization" above, applied to the Status/Deliverables screens specifically | FEAT-05.1, FEAT-05.2 | Same ownership checks | **Critical** |
| XSS via uploaded/displayed content | A malicious filename or deliverable metadata renders unsanitized | Deliverables list rendering | Output encoding on all rendered user/staff-supplied content (ASVS V5) | **Medium** |
| Session left open on a shared/public device | Given the Solange persona's mobile, potentially shared-device usage context (`docs/ux/UX_RESEARCH.md`) | Client device, outside Z-GATE's direct control | Reasonable session timeout, clear logout affordance | **Low-Medium** — a real, sourced usage-context risk, mitigated by UX not just engineering |

## 6. Staff Portal

| Threat | Description | Attack surface | Controls | Risk |
|---|---|---|---|---|
| Compromised staff credential → full client data access | Given the Advisory Associate's role covers every current client (`docs/business/ROLE_MATRIX.md`) | Staff login | MFA strongly recommended once the underlying system supports it (Data Privacy Policy §7 already commits to this "where supported") — see `SECURITY_REQUIREMENTS.md` | **Critical** — the single highest-impact account in the current system, given it's effectively the only staff account at MVP |
| Insider risk (an assigned staff member misusing legitimate access) | A logged-in Advisory Associate viewing/exporting more data than a task requires | Any staff data view | Access logging (`docs/architecture/DATA_ARCHITECTURE.md` `access_log`) makes this detectable after the fact via quarterly review — does not prevent a single bad act, but ensures it's not invisible | **Medium** — real but proportionate given the small, known team at MVP scale |

## 7. Documents (Deliverables)

| Threat | Description | Attack surface | Controls | Risk |
|---|---|---|---|---|
| Unauthorized access to a stored file | Direct object/URL access bypassing the application's authorization layer | File storage layer | Files never served from a predictable/guessable public URL; access mediated through the application's own authorization check, not direct storage-bucket public access | **High** |
| Malicious file upload | A staff member uploads a file type that executes or exploits a viewer | Deliverable upload (FEAT-06.3) | File-type validation, no execution of uploaded content, storage isolated from application code | **Medium** |

## 8. Financial information

| Threat | Description | Attack surface | Controls | Risk |
|---|---|---|---|---|
| Exposure of client financial/TIN/bank data | Any of the above vulnerability classes, applied to the most sensitive data class this platform holds | `advisory`, `clients` modules | All of the above controls, plus encryption at rest (`DATA_PROTECTION_REQUIREMENTS.md`) | **Critical** — this is Z-GATE's single most sensitive data category (Data Privacy Policy Annex A: "High — financial + national ID data") |

## 9. Source code

| Threat | Description | Attack surface | Controls | Risk |
|---|---|---|---|---|
| Secrets committed to version control | A credential/API key accidentally committed | Git repository | Secret-scanning in CI (not yet configured — `docs/discovery/SECURITY_BASELINE.md`), `.gitignore` hygiene, secrets store (not env files committed to the repo) | **Medium currently** (no code/secrets exist yet), **High once implementation begins** if scanning isn't in place before the first commit with real credentials |
| Unauthorized repository access | Weak access control on the git hosting platform (once one is chosen) | Git hosting account | Standard access control (limited collaborators, no shared credentials), MFA on the hosting account itself | **Medium** |

## 10. Datasets (Data division, V2)

| Threat | Description | Attack surface | Controls | Risk |
|---|---|---|---|---|
| Cross-client dataset contamination | One client's data used to build or benchmark another's deliverable | `data-service` module (V2) | Explicit rule already committed (Data Privacy Policy Annex D: "will not use one Client's data to build or benchmark another Client's Deliverables without written consent") — must be enforced architecturally (separate storage/query scope per engagement), not just policy | **High**, once this module exists — not yet built, so currently theoretical |

## 11. Academy information

| Threat | Description | Attack surface | Controls | Risk |
|---|---|---|---|---|
| Individual learner performance exposed to a corporate client beyond the agreed aggregate summary | `academy` module (V1) | Explicit rule already committed (Data Privacy Policy Annex B) — enforced by only exposing aggregate query results to corporate-client-facing views, never row-level learner data | **Medium** — Moderate sensitivity classification, but a real, named commitment that must be architecturally enforced, not just promised |

## 12. Administrative functions

| Threat | Description | Attack surface | Controls | Risk |
|---|---|---|---|---|
| Unauthorized privilege grant via Admin (V1) | An attacker or malicious insider grants themselves/another account elevated access | `admin` module, FEAT-09.2 | Admin actions logged (audit), Admin role itself tightly restricted (MD only, at V1 scale), confirmation step on access changes (`docs/design/COMPONENT_SPECIFICATION.md` Modals — "critical action" pattern) | **High** once this module exists (V1) — the blast radius of a compromised Admin account is the entire system's access model |

## 13. Cloud infrastructure

| Threat | Description | Attack surface | Controls | Risk |
|---|---|---|---|---|
| Misconfiguration (open database port, public storage bucket, etc.) | Infrastructure-level exposure independent of application code correctness | Hosting provider configuration | Infrastructure-as-code review where practical, least-privilege cloud credentials, no default-open access | **High** — a classic, extremely common real-world breach cause, and currently **unassessable in detail** because the hosting region/provider itself is an open decision (ADR-004) |
| Region/compliance gap | Data stored somewhere inconsistent with the Data Privacy Policy's Rwanda-residency commitment | Hosting region choice | Resolved only once ADR-004 is decided | **High**, directly tied to the open ADR |

## 14. Third-party services

| Threat | Description | Attack surface | Controls | Risk |
|---|---|---|---|---|
| Vendor data mishandling | A third-party processor (email provider, future WhatsApp API) mishandles data it touches | Any integrated third party | Sub-processor security assessment before adoption (already-committed rule, Data Privacy Policy §8), named in the applicable Service Schedule | **Medium** — currently minimal exposure since almost no third parties are integrated (`docs/architecture/INTEGRATION_ARCHITECTURE.md`) |
| Supply-chain risk (vulnerable open-source dependency) | A compromised or vulnerable package in the application's dependency tree | Dependency tree of the chosen frameworks | Dependency/SCA scanning in CI (`SECURITY_TESTING_STRATEGY.md`) | **Medium**, standard and manageable with tooling |

---

## Risk summary (Critical items requiring architectural sign-off before implementation)

1. **Broken object/access-level authorization enabling cross-client data exposure** (§2, §4, §5, §8) — the platform's single most important control; every module's authorization check must be independently verified, not assumed correct because "it's checked somewhere."
2. **Privilege escalation from client to staff role** (§4) — role must be server-authoritative, never client-influenced.
3. **Compromise of the (currently sole) staff account** (§6) — MFA and strong credential hygiene are not optional nice-to-haves given how concentrated access currently is.

All three trace back to the same underlying principle: with a small team and a small client base, the *number* of accounts that matter is small, but the *blast radius* of any one of them being compromised is the entire client base's financial and personal data. This is the opposite risk profile from a large SaaS platform (many low-value individual accounts) — it should shape testing priority in `SECURITY_TESTING_STRATEGY.md` accordingly.
