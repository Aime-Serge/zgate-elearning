# Z-GATE Digital Platform — Rollback Runbook

Companion to `docs/devops/DEPLOYMENT_RUNBOOK.md` — reached from its step 9, or any time a production deploy turns out to be wrong after the fact. This document exists so a rollback decision is a known procedure, not something improvised under pressure with a real user-facing problem live.

## Decision: should you roll back?

Roll back when any of the following is true, without needing further discussion first:

- `/api/health` or `/api/ready` fails after a deploy and doesn't recover within a few minutes.
- Error rate (`docs/devops/MONITORING.md`) visibly spikes after a deploy, correlated with the deploy time.
- A smoke test of the release's own feature fails against production.
- A user or staff member reports a new, deploy-correlated problem before you've finished your own post-deploy monitoring window.

**When in doubt, roll back first, investigate after.** A reverted release is a known-good state; a broken release investigated live, in production, with real Client data behind it, is not the moment to be debugging root cause under pressure — that's what the post-incident review (`docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md` phase 6) is for, afterward, calmly.

## Application rollback

**Mechanism: redeploy a prior image, never rebuild from source under pressure.** Every production image is tagged with the exact commit SHA it was built from (`publish-images` in `.github/workflows/ci.yml`) and is immutable once published — the previous release's image still exists in GHCR, untouched by whatever went wrong in the new one.

1. Identify the last known-good SHA — the one recorded in the deploy log/approval note (`docs/devops/DEPLOYMENT_RUNBOOK.md` production step 3).
2. Pull `ghcr.io/<repo>-api:<previous-sha>` and `ghcr.io/<repo>-web:<previous-sha>`.
3. Replace the currently-running (broken) containers with these — the exact same "replace the running container" mechanism as a forward deploy, just pointed at an older tag. There is no separate "rollback tool" to learn; it's the deployment runbook's step 6, run backward.
4. Verify exactly as in `docs/devops/DEPLOYMENT_RUNBOOK.md`'s step 7 — `/api/health`, `/api/ready`, a smoke test. A rollback isn't complete until it's verified the same way a forward deploy is; don't assume "redeployed the old image" automatically means "actually working."
5. Record the rollback (what was rolled back, from which SHA to which, when, why) — same lightweight note-taking as a forward release, and required input to the post-incident review if this rollback followed a real user-facing problem.

## Database rollback — deliberately not symmetric with application rollback

`docs/database/MIGRATION_STRATEGY.md`'s principle: **forward-only, no down-migrations maintained as a matter of course.** This is not an oversight this runbook works around — it's the deliberate design, restated here because a rollback is exactly the moment someone might reach for a down-migration that was never written or tested:

- **If a migration applied in the broken release caused a problem but didn't destroy data** (e.g., a `NOT NULL` constraint that's too strict, a wrong default): write and apply a new, forward, corrective migration — reviewed like any other schema change (`MIGRATION_STRATEGY.md`). Do not hand-edit the database directly, including under incident pressure (`docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md`'s containment actions operate on data/access, never on schema, for exactly this reason).
- **If a migration or the application itself actually destroyed or corrupted real data**: this is a restore, not a rollback — go to `docs/devops/BACKUP_RECOVERY.md`'s restore procedure. This is a materially bigger decision than an application rollback (it can lose any writes made between the backup and the restore point) and should not be taken without the same MD involvement a real incident already requires (`docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md`).
- **If the application rollback alone (old code, unchanged schema) resolves the problem**: nothing else is needed — this is the common case, since `scripts/migrate.mjs`'s migrations are additive far more often than they're breaking, and an old application version is usually compatible with a newer, additive schema.

## Rollback of `scripts/migrate.mjs` itself

If the migration *runner* (not a specific migration file) is what's broken — a bug in `scripts/migrate.mjs` itself causing a bad partial apply — treat this as an application code problem: roll back the API image (which bundles `scripts/` and `db/migrations/` together, `Dockerfile`'s `prod` stage) to a prior SHA, then re-run migrations from that older, known-good script version. This is exactly why the migration runner ships bundled inside the same versioned image as the rest of the application rather than as a separately-deployed tool — "what ran the migration" and "what's deployed" can never drift apart or need independent rollback tracking.

## What "rollback" does not mean here

It does not mean reverting a git commit and re-triggering CI — that rebuilds from source, which is slower and, under pressure, a chance to introduce a *new* problem into what should be a return to a known-good state. It does not mean a database down-migration — none exist, by design (`docs/database/MIGRATION_STRATEGY.md`). It does not mean this can be done silently — a rollback that followed a real user-facing problem is itself an input to `docs/devops/INCIDENT_RUNBOOK.md`'s post-incident review, not a private fix-and-move-on.
