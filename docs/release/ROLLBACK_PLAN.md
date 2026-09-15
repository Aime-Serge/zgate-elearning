# Z-GATE Digital Platform — Rollback Plan (v0.1.0-rc1)

This release's specific rollback plan. `docs/devops/ROLLBACK_RUNBOOK.md` is the general, reusable mechanism (redeploy a prior SHA-tagged image; forward-only migrations, never a down-script; when to restore from backup instead). This document is what that mechanism means concretely for *this* release, including the one thing that makes it different from every rollback after it: **there is no prior production version to roll back to.**

## The honest starting position

v0.1.0-rc1 is release candidate 1. Nothing has ever run in production. A "rollback" in the conventional sense — redeploy the previous known-good release — has no target to redeploy, because there isn't a previous release. This document exists anyway, for two real reasons:

1. **Staging rollback is real and possible today**, even though production rollback isn't yet — staging can be deployed, found broken, and rolled back (to nothing running, i.e., stopped) the same day a staging target exists, well before production is ever in scope.
2. **The mechanism needs to be correct and ready before the first production deployment happens**, not designed for the first time under pressure during that deployment's own post-deploy monitoring window. This document is that readiness check, specific to this release.

## If staging deployment of v0.1.0-rc1 needs to be rolled back

Since there's no prior staging release either, "rollback" here means **stop and revert to no deployment**, not redeploy an older version:

1. Stop the running staging containers.
2. Do not leave a half-migrated staging database around — if `scripts/migrate.mjs` had already applied migrations before the problem was found, that's fine to leave applied (migrations are additive and forward-only; re-running the same script later is a no-op for already-applied files, `docs/database/MIGRATION_STRATEGY.md`). If a specific migration is itself the problem, write a new corrective migration rather than trying to reverse it (same forward-only principle).
3. Fix the issue on `develop`, re-verify (`docs/release/RELEASE_CHECKLIST.md`'s checks, re-run), and treat the next attempt as a new release candidate (v0.1.0-rc2), not a patched rc1 — a release candidate that changes after being tagged isn't the candidate that was verified anymore.

## If production deployment of v0.1.0-rc1 needs to be rolled back

This is the scenario `docs/devops/ROLLBACK_RUNBOOK.md`'s general mechanism describes, applied to this release's specific position as the *first* one:

1. **Decision:** use `docs/devops/ROLLBACK_RUNBOOK.md`'s decision criteria (`/api/health`/`/api/ready` failing, error-rate spike, failed smoke test, a user-reported deploy-correlated problem) — when in doubt, roll back first, investigate after.
2. **Application:** since there is no prior production image to redeploy, "rollback" for this specific release means **stop serving traffic from the new deployment** — take the application out of service — rather than redeploying an older version that doesn't exist. This is a real, material difference from every subsequent release's rollback, and is the reason this document calls it out explicitly rather than pointing silently at the general runbook.
3. **Database:** exactly as the general runbook specifies — a schema problem gets a new forward migration, never a down-script; genuine data loss goes to `docs/devops/BACKUP_RECOVERY.md`'s restore procedure. Because this is the *first* production deployment, "restore from backup" for this release specifically could mean restoring to a genuinely empty, pre-launch state (there is no meaningful prior data to lose beyond whatever was written in the brief window this release was live) — a materially lower-stakes recovery than a later release's rollback would face, and worth remembering under pressure rather than treating this like an nth-release incident by default.
4. **Communication:** same as any incident — direct to the MD, `docs/devops/INCIDENT_RUNBOOK.md`'s channel and notification-content standard, especially relevant here since this would be this platform's very first production incident.

## What changes starting with the next release (v0.1.0-rc2 or v0.2.0, whichever this becomes)

Once v0.1.0-rc1 (or whatever version actually reaches production first) has run successfully, every release after it gets a *real* rollback target — `docs/devops/ROLLBACK_RUNBOOK.md`'s mechanism as written, redeploying the immutable, SHA-tagged image of the last known-good release. This document's "stop and revert to nothing" version is specific to being first, and should not be copied forward as a template for later releases without updating it to reflect that a real prior version then exists.

## Verification performed for this plan

This plan was written against the actual mechanism verified in `docs/release/RELEASE_CHECKLIST.md` (image tagging via `publish-images`, `scripts/migrate.mjs`'s forward-only, transaction-per-file design, and the health/readiness endpoints this release added and fixed) — it does not invent a rollback capability beyond what that checklist confirmed exists. It has not been exercised against a real deployment, since none has happened yet; the first real production deployment's own post-deploy monitoring window is this plan's first real test, same as `docs/devops/ROLLBACK_RUNBOOK.md`'s general mechanism.

## What this document does not do

It does not claim a rollback has ever been performed for this platform — none has, since nothing has deployed to production yet. It does not replace `docs/devops/ROLLBACK_RUNBOOK.md`'s general mechanism, which remains the authority for every release after this one; this document is specific to v0.1.0-rc1's unusual position as the first release, not a permanent process document.
