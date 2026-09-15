# Z-GATE Digital Platform — Module Architecture

How `DOMAIN_ARCHITECTURE.md`'s domains map to actual modules inside the one deployable monolith, and the rules governing how those modules talk to each other.

## Modular monolith — what that actually means here

One deployable backend service, one deployable frontend (or one unified full-stack deployment, depending on the framework decision deferred to the frontend/backend architecture phase), one database. Internally, the backend is organized into modules with explicit boundaries — each module owns its own data access and business logic, and other modules reach it only through a defined internal interface, never by reaching directly into its database tables. This gets the main practical benefit of microservices (enforced boundaries, independent reasoning about each domain) without the operational cost (network calls, distributed transactions, multiple deployments) that this platform's real scale doesn't justify.

## MVP module map

```
zgate-platform/
├── identity/        (Identity domain)
├── clients/          (Clients domain)
├── crm/               (CRM domain)
├── advisory/          (Advisory domain)
├── reporting/         (Internal Reporting — reads from crm, advisory; owns no primary data itself)
├── audit/              (cross-cutting: every module writes here, nothing reads from it at MVP beyond raw storage)
├── documents/          (Documents domain — used by advisory for Deliverables)
└── web/                (public website + portal frontends — consumes the above via internal API calls)
```

## Module responsibilities & boundaries

| Module | Owns | Consumes from | Never does |
|---|---|---|---|
| `identity` | Accounts, credentials, sessions, role assignment | Nothing (foundational) | Does not know about Clients, Advisory, or any business domain — a login only knows "who," not "what they can see" |
| `clients` | Client record, Client↔Engagement linkage | `identity` (to check who's asking) | Does not store engagement-specific data (compliance status, deliverables) |
| `crm` | Lead records, conversion action | `identity`, writes to `clients` on conversion | Does not implement automation/scoring beyond FEAT-03.1/03.2 |
| `advisory` | Compliance calendar, close-out/filing records, Advisory-specific Deliverables | `clients`, `identity`, writes to `documents` | Does not implement billing, does not implement a generic SLA engine (see `DOMAIN_ARCHITECTURE.md` §11) |
| `documents` | File metadata + storage reference | `identity` (for access control), referenced by `advisory` (and, at V1, `academy`) | Does not implement versioning, approval workflows, or a general DMS |
| `reporting` | No primary data — queries `crm` and `advisory` directly for summary numbers | `crm`, `advisory` | Does not duplicate data from other modules into its own tables — avoids the classic stale-analytics-copy problem at a scale where a live query is perfectly cheap |
| `audit` | Append-only access-log records | Written to by every other module | Does not enforce authorization itself — it records what happened, it doesn't decide what's allowed |

**V1 additions:** `academy` (Course, Cohort, Enrollment, Attendance, Assessment, Certificate), `admin` (user management UI over `identity`).
**V2 additions:** `tech-ops` (SupportTicket, HostedSystem), `data-service` (external Dataset/ReportTemplate/DataRequest).

## Internal communication rules

- **In-process function/method calls only** at MVP/V1/V2 — no internal HTTP calls between modules, no message queue between modules. This is the actual meaning of "monolith": modules are a code-organization discipline, not a network topology.
- **A module never queries another module's database tables directly** — even inside one database, one schema/table-set per module, accessed only through that module's own code. This is what makes future extraction *possible* (documented, not committed to) without having been an accidental side effect of tight coupling.
- **Authorization is enforced at the boundary of every module**, using data from `identity`, not centralized in one "gatekeeper" — each module (`advisory`, `documents`, etc.) checks "does this caller have a role/ownership relationship that permits this" before acting, per the Data Privacy Policy's per-division access rule (`docs/business/ROLE_MATRIX.md` §4).
- **Every write to a Client's compliance-critical or personal data triggers an `audit` write**, in the same transaction where practical — this operationalizes the Data Privacy Policy's access-logging commitment from day one rather than bolting it on later.

## Frontend module direction

- **Public website:** server-rendered or statically generated (framework choice deferred), organized by the pages in `docs/design/PAGE_SPECIFICATIONS.md` — Home, four division pages, Contact.
- **Client Portal, Staff Portal:** a client-rendered application (or server-rendered with client-side interactivity — framework choice deferred) consuming the backend modules' APIs, organized by the IA in `docs/ux/INFORMATION_ARCHITECTURE.md` — deliberately kept structurally flat at MVP (matching that document's "don't promise a capability that doesn't exist" rule).
- **Component layer:** implements `docs/design/COMPONENT_SPECIFICATION.md` directly — the design system, not a new one invented at implementation time.

## Extraction points (documented for the future, not built now)

If a module ever genuinely needs independent scaling or deployment (a real, demonstrated need — not a hypothetical one), the module boundaries above are exactly where a service would be cut out: `reporting` (if internal analytics ever needs heavier, asynchronous processing) and `data-service` (V2, once external Data clients generate enough real load) are the most plausible future extraction candidates, precisely because they're read-heavy and less transactionally coupled to the rest of the system than `advisory` or `identity` are. This is noted for future architects, not a commitment or a roadmap item.

## What this document does not do

It does not choose a specific backend framework, ORM, or frontend library — those are the dedicated `docs(backend)`/`docs(frontend)` phases' decisions, made within these module boundaries. It does not write actual code or folder structures beyond the illustrative module map above.
