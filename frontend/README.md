# Z-GATE Public Website

Next.js (App Router) frontend — see `docs/frontend/` at the repo root for the full architecture (route map, component/state architecture, security, testing) and `docs/devops/DEVELOPMENT_ENVIRONMENT.md` for how to run this alongside the backend.

## Quick reference

Prefer `docker compose up` from the repo root over running this package standalone — see the root `README.md`. If running directly:

```bash
npm ci
cp .env.example .env.local
npm run dev      # http://localhost:3001 (not 3000 - that's the backend)
npm run lint
npm run typecheck
npm test
npm run build
```
