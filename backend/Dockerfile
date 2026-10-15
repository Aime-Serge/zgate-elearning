# Z-GATE e-learning API (Fastify + Kysely + PostgreSQL).
#
# Build context is the REPOSITORY ROOT (the pnpm lockfile and workspace
# manifest live there):
#   docker build -f elearning/backend/Dockerfile -t zgate-learn-api .
#
# Production image only. Local development uses platform/scripts/dev.Dockerfile
# via docker-compose.yml.

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo

# ---- build: install from the lockfile, compile, then extract a
# production-only bundle with `pnpm deploy` ----
FROM base AS build
# Lockfile + workspace manifest first, so the dependency download layer
# is cached until dependencies actually change.
# package.json too: Corepack reads the pinned pnpm from its "packageManager"
# field. Without it, Corepack downloads the newest pnpm instead.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --filter "@zgate/elearning-backend..."
RUN pnpm --filter @zgate/elearning-backend run build
# Copies only the package's `files` (dist, scripts, db/migrations) plus
# production dependencies - no source, tests or dev tooling.
RUN pnpm --filter @zgate/elearning-backend deploy --prod --legacy /out

# ---- prod: minimal runtime image ----
FROM node:22-slim AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./

# Non-root runtime user (docs/security/SECURITY_REQUIREMENTS.md V14).
RUN groupadd --gid 1001 zgate && useradd --uid 1001 --gid zgate --shell /bin/false zgate
USER zgate

ENV PORT=3000
EXPOSE 3000

# Liveness probe - plain node fetch; curl/wget aren't installed on -slim.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Migrations ship in the same image: `node scripts/migrate.mjs`
# (docs/devops/DEPLOYMENT_RUNBOOK.md), run as a one-off before rollout.
CMD ["node", "dist/server.js"]
