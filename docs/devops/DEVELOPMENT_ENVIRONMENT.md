# Z-GATE Digital Platform — Development Environment

This is the reproducible development foundation this repository builds on. It establishes tooling only — no application modules (`identity`, `advisory`, etc., per `docs/architecture/MODULE_ARCHITECTURE.md`) exist yet; those land in the dedicated backend/frontend architecture phases. `src/health.ts` is a deliberate, labeled placeholder proving the toolchain works end-to-end, not real application code.

## Why Node/TypeScript isolation, not a Python venv

The operating brief for this phase includes generic Python-venv instructions. **This project's language is TypeScript** (`docs/architecture/ADR/ADR-003-typescript.md`, decided in the architecture phase and grounded in the actual Junior Developer job description) — there is no Python component to isolate. Applying a Python venv here would be following a generic template past the point where a real, already-justified decision supersedes it. The equivalent isolation for a Node/TypeScript project — and what this repository actually does — is:

- **Local `node_modules/`, never global installs.** Every dependency is a `devDependency` in `package.json`, installed locally. Nothing is installed with `npm install -g`.
- **A committed lockfile (`package-lock.json`).** `npm ci` (not `npm install`) is used in CI and should be preferred locally when you just need to install exactly what's locked — it fails instead of silently drifting if the lockfile and `package.json` disagree.
- If a Python component is ever genuinely needed (e.g., a future data-science-heavy piece of the V2 `data-service` module), the standard `python3 -m venv .venv` pattern applies then, scoped to wherever that code lives — not retrofitted here speculatively.

## Prerequisites

- Node.js 22.x (this repo was set up and verified against `v22.22.1`; anything ≥ 20 should work per `package.json`'s `engines` field)
- npm (ships with Node; verified against `9.2.0`)

No other global tool is required to develop against this foundation.

## Getting started

```bash
git clone <repo-url>
cd Z-Gate
npm ci              # installs exactly what's in package-lock.json
cp .env.example .env  # fill in real local values - never commit .env
```

## Scripts

| Command | What it does |
|---|---|
| `npm run lint` | ESLint over the whole repo (type-aware rules on `src/`) |
| `npm run lint:fix` | Same, auto-fixing what it safely can |
| `npm run format` | Prettier check (does not modify files) — scoped to code/config, not `docs/**` (see below) |
| `npm run format:write` | Prettier, writes fixes |
| `npm run typecheck` | `tsc --noEmit` — type errors without emitting build output |
| `npm test` | Runs the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode, for local development |
| `npm run build` | Compiles `src/` to `dist/` via `tsc` |

Every one of these is verified working as of this commit — not just configured, actually run successfully end-to-end before being committed.

## Why `docs/**` is excluded from Prettier

Seven prior phases of this engagement produced 57 reviewed, committed markdown documents before this devops phase began. Running a formatter across all of them now would make this "establish development foundation" commit touch every previous phase's output as a side effect — the opposite of the "focused commit" this phase is explicitly asked for. `.prettierignore` excludes `docs/**` and the two approved root-level brand/business source files for the same reason. Any *new* documentation this repo's own scripts should format normally (e.g., this file).

## Environment configuration

`.env.example` is the template — copy it to `.env` locally. **`.env` is gitignored and must never be committed.** The variable names in `.env.example` anticipate `docs/architecture/DATA_ARCHITECTURE.md` (a `DATABASE_URL` for PostgreSQL) and `docs/architecture/ADR/ADR-005-self-hosted-auth.md` (a `SESSION_SECRET`) — they will grow as the backend phase adds real modules, not before.

**Never point local development at a database containing real Client data.** This is not a suggestion — it's an already-committed rule (Data Privacy Policy Annex C, restated in `docs/security/DATA_PROTECTION_REQUIREMENTS.md`): dev/staging never hold real Client production data without written consent and anonymization.

## CI pipeline

`.github/workflows/ci.yml` runs on every push/PR to `develop` and `main`: **Install → Lint → Type Check → Test → Security Scan → Build**, exactly the sequence this phase specifies. Security Scan is two steps: `npm audit` (dependency/SCA scanning) and a `gitleaks` secrets scan across commit history, not just the working tree — both free/open-source, proportionate to the project's real budget (`docs/architecture/DEPLOYMENT_ARCHITECTURE.md`'s cost baseline). **No deployment job exists yet** — per this phase's explicit instruction not to deploy production, and consistent with `docs/security/SECURITY_TESTING_STRATEGY.md`'s cost-gated, staged approach to production readiness.

## Secrets — the one rule that overrides all others here

Never commit a real secret, anywhere, for any reason — not in `.env`, not in a config file, not in a comment "temporarily." If one is committed by accident, treat it as a security incident per `docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md`, not just a git-history cleanup task (a rotated credential is required, not just a removed commit).

## Branching & commit convention

This repository has followed one focused commit per project phase on `develop` (`docs(discovery)`, `docs(business)`, `docs(product)`, `docs(ux)`, `docs(marketing)`, `docs(design)`, `docs(architecture)`, `docs(security)`, and now this one) — this devops foundation continues that pattern: `chore(devops): establish development foundation`.
