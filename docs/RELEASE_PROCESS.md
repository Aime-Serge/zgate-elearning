# Z-GATE Digital Platform — Release Process

**Full depth: `docs/devops/DEPLOYMENT_RUNBOOK.md` (the general mechanism), `docs/release/` (this specific release candidate's actual documents — `RELEASE_NOTES.md`, `RELEASE_CHECKLIST.md`, `KNOWN_ISSUES.md`, `DEPLOYMENT_PLAN.md`, `ROLLBACK_PLAN.md`, `COMMERCIAL_READINESS.md`).** This document is the process description; those are the living artifacts of the actual current release.

## The pipeline, as it actually exists today

1. Work happens on `develop` — one focused commit per concern, verified (lint/typecheck/test/build) before every commit.
2. A release candidate is tagged (`v0.1.0-rc1` is the current one, tagged locally and pushed).
3. A pull request from `develop` into `main` is opened — `main` is the release branch, seeded from `develop`'s own root commit so it carries real, reviewable history rather than being an unrelated orphan.
4. CI (`.github/workflows/ci.yml`) runs for real on GitHub Actions — lint, typecheck, migrations against a live ephemeral Postgres, tests, dependency audit, secrets scan (gitleaks), build, for both packages independently.
5. On merge to `main`, `publish-images` builds and pushes SHA-tagged, immutable production images to GHCR — **artifact preparation, never an automated deployment.**
6. A real deployment to staging or production is a separate, manual, approval-gated action per `docs/devops/DEPLOYMENT_RUNBOOK.md` — nothing in this pipeline deploys anywhere on its own.

## Where the current release candidate actually stands

- Repository: `github.com/Aime-Serge/z-gate` (public). PR #1 (`develop` → `main`) is open, mergeable, and CI-green as of this handover.
- **Not merged.** Merging triggers `publish-images`, a bigger, more consequential step than anything asked of any phase to date — left for an explicit decision by whoever owns this repository next.
- **Release gate result, per the independent audit that followed the release-candidate phase: BLOCKED**, not approved (`docs/SECURITY_GUIDE.md`). The release-candidate phase's own checklist passed every *software* gate it checked; the audit that came after found real defects that checklist didn't catch, which is exactly what an independent second pass exists to do.

## Versioning

`v0.1.0-rc1` is a git tag, not (yet) reflected in either package's `package.json` (backend `0.0.0`, frontend `0.1.0` — both untouched scaffold defaults). Recommend reconciling both to a single, deliberate version number as part of whatever release actually ships first — a small, cheap fix, not done in this pass to avoid making an uninvited versioning decision mid-handover.

## The discipline worth preserving

Every release-adjacent document in this repository states plainly what was verified and how, and what wasn't — "local verification only, no reachable database" is written out loud dozens of times across this engagement rather than glossed over. Whoever continues this project should keep that standard; it's the reason a real, independent second-pass audit was able to trust the underlying codebase enough to focus on finding genuinely new issues instead of re-litigating old claims.
