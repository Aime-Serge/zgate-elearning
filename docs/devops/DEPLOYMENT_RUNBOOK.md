# Z-GATE Digital Platform — Deployment Runbook

Operational companion to `docs/devops/PRODUCTION_ARCHITECTURE.md` — that document explains *why* the pipeline is shaped this way; this one is the step-by-step a human actually follows to run it.

## Release approval gate — read this before anything else

**No deployment to production happens without explicit release approval from the Managing Director** (this phase's own binding instruction, consistent with `docs/architecture/DEPLOYMENT_ARCHITECTURE.md`'s "every deployment to production is preceded by a staging deployment" rule — staging verification is the technical gate, MD approval is the business gate, and both are required, not either/or).

**Production deployment is additionally blocked today on `docs/architecture/ADR/ADR-004-data-residency-hosting-region.md`** — there is no approved hosting target for real Client data yet. Nothing in this runbook's production section can be executed until that ADR resolves. The staging section can be executed as soon as any reasonable, cheap infrastructure target is chosen (ADR-004 explicitly does not block staging, since staging never holds real Client data).

## Prerequisites (any environment)

- `ci` and `web-ci` (`.github/workflows/ci.yml`) both green on the commit being deployed.
- For a production release specifically: the commit is on `main`, and `publish-images` has successfully pushed `ghcr.io/<repo>-api:<sha>` and `ghcr.io/<repo>-web:<sha>`.
- The target environment's `DATABASE_URL`, `SESSION_SECRET`, `SESSION_SALT`, `WEB_ORIGIN`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, and `EMAIL_PROVIDER_API_KEY` are set in that environment's own secret store (`docs/devops/PRODUCTION_ARCHITECTURE.md`'s Secrets management section) — never passed on a command line, never typed into a shared terminal, never committed anywhere as a fallback.

## Staging deployment

Staging is not blocked by ADR-004, but **no specific staging host has been provisioned or approved as of this phase** — this section describes the procedure to follow once one is chosen; it does not assert one exists.

1. Confirm the target commit is on `develop` (or `main`, if promoting a release candidate through staging first) and CI is green.
2. Pull (or build locally, if no registry step exists yet for staging specifically) the image tagged with that commit's SHA.
3. Set the staging environment's variables per **Prerequisites** above — anonymized/synthetic data only in the staging database, never real Client data (Data Privacy Policy Annex C, restated in every architecture document this engagement has produced).
4. Apply migrations: `DATABASE_URL=<staging-url> node scripts/migrate.mjs`. Review its output — it prints exactly which files it applied (or "up to date" if none were pending).
5. Start (or replace) the running container(s) — backend on its configured `PORT` (default 3000), frontend on its configured `PORT` (default 3001).
6. Verify:
   - `curl https://<staging-api-host>/api/health` → `{"status":"ok",...}`
   - `curl https://<staging-api-host>/api/ready` → `{"status":"ready","checks":{"database":"ok"}}`
   - Load the staging frontend in a browser; confirm it reaches the staging API (not production, not another environment) — check `NEXT_PUBLIC_API_URL` if this is ever in doubt.
7. Smoke test the golden paths that matter most for this release (login, the specific feature being verified) against staging before declaring it verified.

## Production deployment

**Do not proceed past this line without (a) a documented MD release approval for this specific release, and (b) ADR-004 resolved with a real, approved production hosting target.** If either is missing, stop here and escalate — this is not a step to work around.

1. Confirm staging verification (above) passed for the exact same commit SHA being promoted — never a different commit "close enough" to what staging verified.
2. Confirm `publish-images` produced `ghcr.io/<repo>-api:<sha>` and `ghcr.io/<repo>-web:<sha>` for this commit.
3. Record the release: the commit SHA, who approved it, and when — even a one-line note in whatever channel the MD approval came through (WhatsApp, per `docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md`'s already-established primary channel for this small a team) is enough; this is what `docs/devops/ROLLBACK_RUNBOOK.md` and any future incident review will need to know "what was actually running, and since when."
4. **Take a fresh backup immediately before migrating** — even though `docs/devops/BACKUP_RECOVERY.md`'s schedule already runs one daily, a pre-deploy backup is the one that matters most for a same-day rollback (see `docs/devops/ROLLBACK_RUNBOOK.md`).
5. Apply migrations: `DATABASE_URL=<production-url> node scripts/migrate.mjs`, run from a context with production database access — never from a developer's own machine with production credentials sitting in shell history or a local `.env`. Review its output before proceeding to step 6; if it reports a failure, **stop** — do not proceed to swap the running application while the schema and the new code might disagree (see `docs/devops/ROLLBACK_RUNBOOK.md`'s migration-failure path).
6. Replace the running container(s) with the newly published, SHA-tagged images. At this platform's current scale (`docs/architecture/DEPLOYMENT_ARCHITECTURE.md`'s "no orchestration platform" posture), this is a single-instance replace, not a rolling/blue-green deploy — a brief window of unavailability during the swap is expected and acceptable at this traffic level, not a defect to engineer around prematurely.
7. Verify, in order:
   - `curl https://<production-api-host>/api/health` → 200
   - `curl https://<production-api-host>/api/ready` → 200 with `"database":"ok"` — if this fails, the database connection (not just the process) is broken; do not consider the deploy successful
   - Load the production frontend; confirm it's serving the new build (check for the expected change, or a version/commit marker if one exists)
   - Run the same smoke test used in staging, against production, for the specific feature this release changes
8. Monitor error rate and `/api/ready` for the next 15–30 minutes (`docs/devops/MONITORING.md`) before considering the deploy complete and moving on to other work — most real deploy problems surface in this window, not at the instant of the swap itself.
9. If any verification step in 7–8 fails: go to `docs/devops/ROLLBACK_RUNBOOK.md` immediately. Do not attempt to "fix forward" under production pressure without at least considering rollback first — that runbook exists specifically so this decision isn't made from scratch during an incident.

## What this runbook does not do

It does not name a specific hosting platform's exact CLI commands (`aws ...`, `flyctl ...`, `render ...`) — no platform is chosen yet (ADR-004). Every step above is written to be correct regardless of which platform is eventually chosen; the platform-specific "how do I actually replace a running container on X" detail gets added to this document once that choice is made, not guessed at now. It does not commit to a specific deployment frequency or release cadence — team size (`docs/business/ROLE_MATRIX.md`) doesn't currently support a fixed release train, and forcing one wouldn't serve the platform's actual users.
