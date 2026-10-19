# Z-GATE Operations Portal (legacy, frozen)

`@zgate/ops`: the v1 web app (public site, client portal and staff console), talking to the e-learning API (`backend/`), which is still the v1 API. Kept running until its replacement exists. **Nothing in this repository may import from `legacy/`** (`pnpm lint:boundaries`). It moved here from the monorepo's `legacy/ops` in the split (ADR-010).

Only security fixes and changes forced by the repository layout land here. Decision D2 in `docs/platform-v2/07-MIGRATION-PLAN.md` keeps it frozen until the first Advisory client needs portal access, then revisits it. The v1 architecture docs are in `docs/frontend/`.

## Quick reference

```bash
cp deploy/env/dev.env.example backend/.env
docker compose -f deploy/compose.yml --profile full --profile legacy up   # http://localhost:3001

# or on the host, with the e-learning API running:
pnpm dev        # http://localhost:3001 (3000 is the API)
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

It is its own pnpm workspace (`package.json`, `pnpm-workspace.yaml`, lockfile): run the commands above inside `legacy/ops/`, after `pnpm install`. CI: `.github/workflows/legacy.yml`. Image, with this folder as the context: `docker build -f legacy/ops/Dockerfile --build-arg NEXT_PUBLIC_API_URL=… --build-arg NEXT_PUBLIC_SITE_URL=… legacy/ops`.
