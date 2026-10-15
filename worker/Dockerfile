# Z-GATE e-learning worker (background jobs).
#
# Build context is the REPOSITORY ROOT (the pnpm lockfile and workspace
# manifest live there):
#   docker build -f elearning/worker/Dockerfile -t zgate-elearning-worker .
#
# Production image only. Local development: `pnpm dev:elearning`, or the
# `full` profile of elearning/deploy/compose.yml.

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo

# ---- build: install from the lockfile, compile, then extract a
# production-only bundle with `pnpm deploy` ----
FROM base AS build
# package.json too: Corepack reads the pinned pnpm from its "packageManager"
# field. Without it, Corepack downloads the newest pnpm instead.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --filter "@zgate/elearning-worker..."
RUN pnpm --filter @zgate/elearning-worker run build
# Copies only the package's `files` (dist) plus production dependencies.
RUN pnpm --filter @zgate/elearning-worker deploy --prod --legacy /out

# ---- prod: minimal runtime image ----
FROM node:22-slim AS prod
# Base-image hardening: Debian security updates, and no package managers
# in the image - it runs with `node` only. (Trivy flagged outdated Debian
# packages and the dependencies of the npm that node:22-slim bundles.)
RUN apt-get update \
 && apt-get upgrade -y --no-install-recommends \
 && rm -rf /var/lib/apt/lists/* \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
      /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/pnpm \
      /usr/local/bin/pnpx /opt/yarn-v*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./

# Non-root runtime user (docs/security/SECURITY_REQUIREMENTS.md V14).
RUN groupadd --gid 1001 zgate && useradd --uid 1001 --gid zgate --shell /bin/false zgate
USER zgate

ENV PORT=3005
EXPOSE 3005

# Liveness probe - plain node fetch; curl/wget aren't installed on -slim.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3005/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
