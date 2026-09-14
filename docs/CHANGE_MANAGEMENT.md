# Z-GATE Digital Platform — Change Management

How changes actually get made in this repository, as practiced across its entire history — not an aspirational process document, a description of the real, working discipline `git log --oneline` demonstrates.

## Branching

- **`develop`** — the standing integration branch. All work happens here.
- **`main`** — the release branch. Advances only via reviewed pull request from `develop`, never direct pushes. Currently seeded from `develop`'s own root commit (a deliberate choice, documented in `docs/devops/DEPLOYMENT_RUNBOOK.md`, so the first release PR carries real, reviewable history instead of being an artificial empty diff).
- No long-lived feature branches have been used to date — the project's actual scale (effectively one contributor per phase) hasn't needed them. If a team grows, short-lived feature branches off `develop`, merged via PR, is the natural next step — nothing about the current structure prevents it.

## Commit discipline

**One focused commit per concern**, not one per feature and not one giant commit per phase. A security fix, a new document, and a refactor touching the same file still get three separate commits. Concretely, this means:

- A bug found during a review phase gets its own commit (`fix(...)`), separate from that phase's own deliverable documentation (`docs(...)`).
- Conventional-ish prefixes are used consistently (`feat`, `fix`, `docs`, `chore`, `perf`, `style`, `refactor`) though not enforced by tooling — a human-readable convention, not a commit-lint gate.
- Every commit message explains *why*, not just *what* — the diff already shows what changed; the message is for the reader who needs to know why it was safe/necessary.
- **Verification before every commit, not after:** lint, typecheck, test, build — all four, both affected packages — run and confirmed clean before the commit is made, not as a follow-up fix.

## Review

There is no second-person code review in this project's history to date — every phase was a single contributor's own work, self-verified against the standing discipline above rather than reviewed by a second person. **This is a real gap for any team beyond one person**, not a process this repository should be assumed to already have. The GitHub pull request now open (`develop` → `main`) is the first artifact in this repository's history actually structured for human review — use it as the template going forward, not as a formality to merge past.

## What triggers a new commit vs. amending

Per the project's own standing rule (also GitHub Code's own default behavior): **new commits, not amended ones**, except by explicit, deliberate choice. A pre-commit hook failure means the commit didn't happen — fix, re-stage, commit fresh, never amend a commit that only exists in your head.

## Documentation as part of the change, not after it

Every phase of this engagement produced its own reviewed documentation *as* the deliverable, not as an afterthought bolted on later. A code change that isn't accompanied by an update to whatever document described the old behavior is an incomplete change, not a "docs debt" item to track separately. This is why `docs/` has stayed accurate enough, across dozens of sequential phases, for an independent audit to trust it enough to go looking for *new* problems instead of re-verifying old claims from scratch.

## Versioning

No formal semver discipline has been applied yet (`package.json` versions are still scaffold defaults — see `docs/RELEASE_PROCESS.md`). Recommend adopting real semantic versioning, bumped deliberately per release, starting with whichever version actually ships first to production.
