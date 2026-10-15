# 05 — Security and Compliance

**Target baseline:** OWASP ASVS 4.0 **Level 2** for `learn`, `ops`, `cms` and the API. The website is static and has no authentication, so it is held to the headers and supply-chain controls only.
**Starting point:** v1's security work is strong and carries over (see [01 §2](01-CURRENT-STATE-ASSESSMENT.md#2-what-is-genuinely-strong-keep-it)). This document covers only what **changes** or is **new**.

## 1. What every open finding becomes in v2

| ID | Finding | v2 resolution | When |
|---|---|---|---|
| F-1 | No audit logging on CRM leads | Fixed in v1 code now (the pattern already exists). v2 audit middleware makes a missing audit call a lint/test failure for routes tagged `dataClass: confidential`. | Phase 0 |
| F-2 | Deactivation has no undo and no guard | Fixed in v1 now: reactivation endpoint; refuse to deactivate yourself or the last active admin. v2: memberships plus revocable sessions. | Phase 0 |
| F-3 | Backend CSP differs from its comment | Set Helmet `useDefaults: false` with explicit directives, plus a test asserting the header. In v2 the API serves no HTML at all (certificates become PDFs behind signed URLs). | Phase 0 / 1 |
| F-4 | `staff_advisory` has the same access as `admin` | `advisory_staff` memberships scoped to `engagement:{id}` | Phase 1 (ops) |
| F-5 | `'unsafe-inline'` CSP | **learn / ops:** strict nonce-based CSP via Next middleware (these pages are dynamic anyway). **Website:** risk accepted with documented reasoning: no auth, no UGC ([04 §9](../../website/docs/04-WEBSITE.md#9-security-posture)). | Phase 2 / 3 |
| F-6 | CI jobs lack a `permissions:` block | Workflow-level `permissions: contents: read` by default; widened per job | Phase 0 |
| F-7 | `X-Powered-By`, dev ports bound to all interfaces | `poweredByHeader: false`; Compose ports bound to `127.0.0.1` | Phase 0 |
| KI-08 / N-3 | Sessions cannot be revoked; they survive password reset | Server-side sessions; revoke on password change, deactivation or role change | Phase 1 |
| CR-8 | No way to provision accounts | Invite flow (staff/client) plus learner self-sign-up | Phase 1 |
| N-1 | No `trustProxy` | Set to the proxy's address or CIDR; add a test | **Phase 0, before any deploy** |
| N-2 | Environment values baked into the image | Same-origin `/api` at the edge; runtime config | Phase 0 (v1 build args as a stopgap), Phase 1 (structural) |
| N-4 | Learners can't have accounts | `learner` role and memberships | Phase 1 |
| N-5 | Enrollment collects PII without a notice | Consent records plus privacy notice | Phase 2 |
| N-7 | Malformed IDs return 500 | Zod schemas validate params at the route level | Phase 1 |
| N-8 | Email has no timeout or retry | Queue delivery, 5 s timeout, retries with backoff | Phase 1 |
| N-10 | Audit log can't record anonymous or system events | `platform.audit_events` (see §4) | Phase 1 |

## 2. Threat model: new assets in v2 (STRIDE)

| Asset / flow | Threat | Control |
|---|---|---|
| **Payment webhooks** | Spoofing (fake "payment succeeded") | Verify the HMAC/signature with a per-provider secret. Optionally allowlist provider IPs. Always confirm by polling the provider before granting access for high-value orders. Idempotent by `provider_ref`. |
| Payment amount | Tampering | The server recomputes the price from the course version. Client-sent amounts are ignored. |
| **Learner accounts** | Credential stuffing | Per-IP **and** per-account rate limits (needs N-1). Breached-password check (k-anonymity HIBP range API, or a local list if residency policy forbids the call). Progressive delays. Alert on spikes. |
| SMS OTP | SIM-swap or OTP interception | OTP valid for 5 minutes, single use, 5 attempts. **Staff cannot use SMS OTP as their MFA** (TOTP or passkeys only). Re-authentication required to change phone or email. |
| Sessions | Hijacking | `__Host-` cookie; rotate the session on login and on privilege change; idle and absolute timeouts; "sign out everywhere" |
| **Certificates** | Forgery or repudiation | Verification code with ≥ 50 bits of entropy; the public verify page reads from the database (a PDF on its own isn't authoritative); revocation; issuance audited |
| Verify page | Enumeration and scraping | Rate limiting; minimal fields shown; `noindex`; codes are not sequential |
| **Course content** | Piracy | Signed, expiring video playback tokens; signed URLs for downloads; optional learner-name watermark on PDFs. Proportionate: deterrence, not DRM. |
| **Quizzes** | Answer leakage or replay | Grading only on the server; answers never sent to the client; attempts bound to the server-side session; attempt limits |
| Enrollments / progress / attempts | IDOR | Every query is scoped by `enrollment.user_id = session.user_id`, or by a membership scope. Object-level checks return 404 (the v1 pattern). Automated IDOR tests for every new resource (the v1 test style carries over). |
| **Org admin** | Over-collection (seeing individual learner results) | Aggregate endpoints only. Individual data requires the learner's `share_with_org` consent. Enforced in the query layer and tested. |
| Assignment uploads | Malware or stored XSS | v1's MIME allowlist and signature checks, plus ClamAV scanning in the worker before files become visible to trainers; always served as `attachment` from the storage domain |
| **CMS** | Website defacement | IP restriction, MFA, publish role limited to two people, version history and rollback, no raw-HTML blocks |
| Outbound webhooks (to the website's revalidate endpoint) | SSRF | Destinations are fixed in configuration, never user-supplied; HMAC-signed |
| **AI features** (future) | Prompt injection; data leakage | Retrieval limited to published course content; no tools with side effects; PII redaction; output labelled as AI; DPIA ([03 §9](../../elearning/docs/03-ELEARNING-PLATFORM.md#9-ai-integration-readiness-gated)) |
| Supply chain | Malicious dependency or action | Lockfile installs; Renovate with grouping and a minimum release age; GitHub Actions pinned to commit SHAs; Trivy image scanning; SBOM; signed images |

## 3. Control baseline (ASVS L2 mapping, summarised)

| ASVS area | Control in v2 |
|---|---|
| V2 Authentication | Argon2id; breached-password check; MFA for every staff role; OTP rules above; generic error messages and constant-time paths (v1) |
| V3 Sessions | Server-side, revocable, rotated, `__Host-` cookie, idle 30 min for staff and 7 days for learners, absolute 12 h for staff |
| V4 Access control | Declarative route policies; deny by default (a route with no policy fails at startup); scoped memberships; object-level 404s |
| V5 Validation | Shared Zod contracts for body, query **and params**; output encoding via React; allowlist rich-text rendering |
| V7 Errors and logging | v1 error envelope kept; `audit_events` (§4); PII redaction in logs |
| V8 Data protection | Classification tags on tables (v1 DATA_ARCHITECTURE carried over); encryption at rest (disk plus backups); TLS 1.2+ everywhere, including the DB connection |
| V9 Communications | HSTS; TLS at Caddy; internal service traffic on a private network |
| V10 Malicious code | Signed images; SBOM; CodeQL |
| V12 Files | v1 controls plus ClamAV; object storage with signed URLs; no local disk |
| V13 API | OpenAPI; versioning; per-route rate limits; idempotency keys |
| V14 Configuration | Validated runtime config; secrets never in images; non-root containers (v1); read-only root filesystems where possible |

## 4. Audit events (replaces `access_log`)

```
platform.audit_events(
  id uuid v7, occurred_at timestamptz,
  actor_type text  -- user | system | anonymous | webhook
  actor_id uuid NULL, session_id uuid NULL,
  action text, resource_type text, resource_id text,
  outcome text     -- success | denied | error
  ip inet NULL, user_agent text NULL, request_id text,
  metadata jsonb   -- never contains secrets or full PII
  prev_hash bytea, hash bytea   -- hash chain for tamper evidence
)
```
- Append-only: the application DB role has `INSERT` and `SELECT` only. No `UPDATE` or `DELETE` grants.
- A hash chain per day, with the daily root hash exported off-host, gives cheap **tamper evidence** without a ledger product.
- Partitioned by month. The retention period follows the legal schedule (OBQ #9).
- It feeds the quarterly access review the Data Privacy Policy already commits to (`docs/business/BUSINESS_RULES.md` §4).

## 5. Secure delivery pipeline

| Control | Tool | Gate |
|---|---|---|
| Branch protection on `main`; required PR review; CODEOWNERS for `infra/`, `apps/api/src/identity`, migrations | GitHub | Merge |
| SAST | CodeQL (free for public repositories) | PR |
| Dependency scanning and updates | `pnpm audit` + Renovate | PR |
| Secrets scanning | gitleaks (kept from v1) + GitHub push protection | PR / push |
| Container scanning | Trivy (OS and library CVEs, misconfiguration) | Image build |
| SBOM and signing | Syft SBOM + cosign keyless signing; deploy verifies the signature | Release |
| DAST | OWASP ZAP baseline scan against staging | Post-deploy to staging |
| Infrastructure secrets | **SOPS + age**, encrypted files in `infra/`, decrypted only on the deploy target | Deploy |
| Deploy credentials | Short-lived; GitHub Environments with required reviewers for production | Deploy |
| Independent pentest | External, scoped to learn, the API and payments | **Before the LMS takes real payments** |
| Vulnerability disclosure | `/.well-known/security.txt` on every host | Launch |

## 6. Data protection: Law N° 058/2021

The LMS changes Z-GATE's processing profile. Before, it handled a handful of client contacts. Now it will process **personal data of many individuals at scale, including payment data**. The pending items in v1 become **hard launch gates**:

| Gate | Status today | Required before |
|---|---|---|
| NCSA registration as controller/processor | Pending (KI-03) | LMS public launch |
| DPO designated | Unfilled (KI-04) | LMS public launch |
| Hosting region / residency decision | Open (ADR-004); recommendation in [02 §9](02-TARGET-ARCHITECTURE.md#9-data-residency-map-adr-004-option-3-hybrid-made-concrete) | Production provisioning |
| **DPIA for the LMS** (learner data, payments, any analytics or profiling) | Not started | LMS public launch |
| Sub-processor register (payment aggregator, email, SMS, video CDN) and contracts | Not started | Each vendor's go-live |
| Privacy notice (website + LMS) and consent records | Missing (CR-6, N-5) | Website v2 launch |
| Retention schedule | Blocked on OBQ #9 for Advisory; learner data can be decided now (proposal below) | LMS launch |
| Data-subject rights tooling: export, correct, delete, object | Missing | LMS launch |
| Breach procedure tested (DPO ≤ 24 h, NCSA ≤ 48 h, affected parties ≤ 48 h) | Defined, not tested | First tabletop exercise before the LMS launch |
| **Minimum learner age / guardian consent** | Undecided (decision D7) | LMS launch |

**Proposed learner-data retention, for counsel to confirm:**
- Account data: life of the account, plus 24 months after the last activity, then anonymized.
- Certificates and the verification record: kept indefinitely, because they are the learner's credential. Shown only in minimal form on the public page.
- Payment records: as required by tax law (align with OBQ #9).
- Raw analytics events: 13 months.
- Audit events: per the legal schedule.

**Lawful basis per processing activity** (to be confirmed in the DPIA):

| Processing | Basis |
|---|---|
| Account, enrollment, delivery, certificate | Contract |
| Payment records | Contract + legal obligation |
| Security and audit logs | Legitimate interest / legal obligation |
| Marketing messages, Advisory cross-sell lead, sharing individual results with an employer org | **Consent** (separate, withdrawable, recorded) |
| Learning analytics for trainers | Legitimate interest. Re-assess before adding any automated profiling (AI #5). |
