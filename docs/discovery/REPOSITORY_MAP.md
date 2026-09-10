# Repository Map

**Status:** FACT (as of 2026-09-10, first `git init` of this directory)

## Actual current structure

```
Z-Gate/                                    (git repo initialized this session; no prior history)
├── zgate-90day-business-plan-gtm (Copy).docx
├── zgate-90day-financial-model.xlsx
├── zgate-brand-identity(1).html
├── zgate-client-sla-templates.docx
├── zgate-data-privacy-security-policy.docx
├── zgate-hr-policy-job-descriptions.docx
├── zgate-mission-vision-about(1).md
├── zgate-rdb-activity-code-review-memo.docx
└── docs/
    └── discovery/                          (this audit, created 2026-09-10)
```

There is **no application source tree** — no `src/`, `app/`, `components/`, `lib/`, `public/`, `tests/`, `scripts/`, `package.json`, `requirements.txt`, or any build/framework configuration file of any kind. The repository consists entirely of business/legal/brand documents plus this audit.

## Note on discovery process

An initial `ls -la` at the very start of this session returned an apparently empty directory (only `.`/`..`). Re-checking via `git status` immediately after `git init` revealed the eight business documents above. This was very likely a stale/cached listing rather than files appearing after the fact (all files carry modification timestamps of 2026-08-27 through 2026-09-09, before this session started). **Lesson recorded:** a single `ls` was treated as ground truth and nearly produced an audit that incorrectly declared "no business documentation exists." Re-verification caught this before any file was written.

**Second incident, same session:** partway through the audit, after the user declined a proposed `git add`/commit, a follow-up `git status` check found the 8 original source documents were no longer in the working directory. Investigation traced them to `~/.local/share/Trash/files/` (deleted at 09:16:59, matching filenames exactly) — not the result of any command this session ran (the only relevant command was a rejected `git add`, which never executed and would not delete files regardless). The 8 files were restored to their original location and names using each file's `.trashinfo` record, with the user's confirmation. Root cause of the move to Trash was not established (most likely an out-of-band action via the desktop file manager) and does not need to be, but is recorded here in case it recurs.

**Third finding, same session:** the user also confirmed a fuller `zgate-full-document-package` exists elsewhere on the machine (`~/Documents/` and `~/Downloads/`), containing two additional source documents not originally present in this project directory — `zgate-business-project-report.docx` (the primary strategy report the RDB Activity-Code Review Memo cites as its source, and which was previously being audited only second-hand) and `zgate-academy-course-curriculum.docx`. Both were copied (not moved) into this project directory and are now part of the reviewed document set (10 total). See `BUSINESS_ALIGNMENT.md` for what they added.

## Conceptual future boundaries (NOT implemented — see Section 19 of the operating brief)

For reference only, once implementation begins, the business documents imply (but do not mandate a specific folder layout for) three broad surfaces:
- **Public platform** — corporate site, division pages, insights/case studies, contact/lead capture.
- **Authenticated client/staff platform** — Client Portal (starts as "Advisory's own internal client portal" per the 90-day roadmap), Staff Portal, Admin.
- **Internal operations services** — CRM, SLA/SOW tracking, billing (EBM-compliant per Rwandan law), Academy LMS, Data/BI reporting pipeline.

No technology choice, file layout, or framework for any of this exists yet. See `TECHNOLOGY_STACK.md` and `OPEN_QUESTIONS.md`.
