# Z-GATE Operations Portal (legacy, frozen)

`@zgate/ops`: the v1 web app (public site, client portal and staff console), talking to `elearning/backend`, which is still the v1 API. Kept running until its replacement exists. **Nothing in this repository may import from `legacy/`** (`pnpm lint:boundaries`).

Only security fixes and changes forced by the repository layout land here. Decision D2 in `docs/platform-v2/07-MIGRATION-PLAN.md` keeps it frozen until the first Advisory client needs portal access, then revisits it. The v1 architecture docs are in `docs/frontend/`.

## Quick reference

```bash
cp elearning/deploy/env/dev.env.example elearning/backend/.env
docker compose -f elearning/deploy/compose.yml --profile full --profile legacy up   # http://localhost:3001

# or on the host, with the e-learning API running:
pnpm --filter @zgate/ops dev        # http://localhost:3001 (3000 is the API)
pnpm --filter @zgate/ops lint
pnpm --filter @zgate/ops typecheck
pnpm --filter @zgate/ops test
pnpm --filter @zgate/ops build
```

CI: `.github/workflows/legacy.yml`. Image: `docker build -f legacy/ops/Dockerfile --build-arg NEXT_PUBLIC_API_URL=… --build-arg NEXT_PUBLIC_SITE_URL=… .` from the repository root.
