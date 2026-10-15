# E-learning worker

`@zgate/elearning-worker`: one process for the e-learning platform's background work, so slow or retry-heavy tasks never run inside an API request. **Skeleton:** an entry point, a job runner, a `/health` endpoint and no jobs yet.

| File            | What it is                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`  | Starts the health server and the runner; stops cleanly on SIGTERM/SIGINT                                                    |
| `src/runner.ts` | Runs every registered job each interval (`WORKER_INTERVAL_MS`, default 30 s), never overlapping, and survives a failing job |
| `src/jobs.ts`   | The job registry (empty)                                                                                                    |
| `src/health.ts` | `GET /health` -> 200 on `PORT` (default 3005)                                                                               |

## Planned jobs

Each arrives with the feature that needs it, as its own module registered in `src/jobs.ts`:

1. **Payment webhooks:** verify and record mobile-money and card payment callbacks, then confirm enrollments. Idempotent per provider event ID.
2. **Email and SMS:** enrollment confirmations, reminders and receipts, with retries and a provider-neutral interface.
3. **Certificate PDFs:** generate a learner's certificate on course completion and store it with a verification ID.
4. **Video processing:** transcode uploads into streaming renditions and captions, and record the result on the lesson.

## Rules

- May import from `shared/*`. Never from `elearning/backend` source: the worker and the API share the database schema (owned by `elearning/backend/db/migrations`), not code. `pnpm lint:boundaries` enforces this.
- Connects as the e-learning app role (`elearning/database/init/01-roles.sql`) once a job needs the database. It never runs migrations.

## Run

```bash
pnpm --filter @zgate/elearning-worker dev     # or: pnpm dev:elearning (API + frontend + worker)
curl http://localhost:3005/health
docker build -f elearning/worker/Dockerfile .  # repository root as build context
```
