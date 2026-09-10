# Technology Stack Audit

## Project technology stack

**FACT:** None exists. There is no `package.json`, no `requirements.txt`/`pyproject.toml`, no `Dockerfile`, no framework config, no `.github/workflows`, no IaC (Terraform/Pulumi/CloudFormation), and no application code of any language. No frontend framework, backend framework, database, or hosting choice has been made or implemented.

**FACT:** No `.env`, `.env.example`, or any secret/credential file exists in the repository. No credentials of any kind were found in source (there is no source).

## Locally available tooling (machine-level, NOT a project decision)

Recorded for reference only — availability of a tool on this machine is not evidence it is the intended stack for Z-GATE's platform:

| Tool | Version |
|---|---|
| OS | Linux 7.0.0-30-generic (Ubuntu-based), x86_64 |
| git | 2.53.0 |
| Node.js | v22.22.1 |
| npm | 9.2.0 |
| pnpm / yarn | not installed |
| Python | 3.14.4 |
| pip | 25.1.1 |
| Docker | 29.1.3 |
| docker compose (v2 plugin) | not installed |
| PostgreSQL client (`psql`) | not installed |
| GitHub CLI (`gh`) | 2.46.0 |
| Terraform | not installed |
| AWS CLI | not installed |
| gcloud CLI | not installed |

**RECOMMENDATION:** Whatever stack is chosen, use an isolated, reproducible environment per the user's standing instruction to always develop in a virtual environment — a Python `venv` for any Python tooling, a project-local `node_modules` (no global installs) for any Node tooling, and/or a Docker/devcontainer setup for full-stack isolation. No such environment has been created yet because no project code exists to isolate.

## What the business documents establish as constraints on a future stack (REQUIREMENT, not a stack choice)

These are hard legal/operational constraints from the approved documents that any future technology decision must satisfy — they do not name a framework or vendor:

- **Data localization:** personal data must be stored within Rwanda by default; any offshore storage requires an NCSA-issued transfer certificate and written client notice (Data Privacy & Security Policy, Clause 6). This has direct implications for hosting/cloud-region choice once one is made.
- **EBM-compliant billing:** all client invoicing must run through an EBM-compliant billing system per RRA requirements (SLA Clause 4). Any future billing/invoicing module must integrate with or be certified as EBM-compliant, not an arbitrary generic invoicing library.
- **Encryption in transit/at rest, MFA, role-based least-privilege access, secrets never stored in plaintext in version control** (Data Privacy & Security Policy §7, Annex C) — baseline technical controls any future Tech-division system must implement.
- **Production/development data separation; no client production data in dev/test without written consent + anonymization** (Annex C).

## Open questions this raises

See `OPEN_QUESTIONS.md` — no framework, hosting provider, database engine, or auth provider has been chosen for the eventual platform, and none should be assumed.
