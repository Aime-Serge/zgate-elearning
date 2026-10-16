# Z-GATE Academy Online - e-learning frontend (Next.js standalone).
#
# Build context is the E-LEARNING WORKSPACE ROOT (elearning/):
#   docker build -f elearning/frontend/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=https://... \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://... \
#     -t zgate-elearning-frontend elearning
#
# NEXT_PUBLIC_* values are inlined into the client bundle and CSP at build
# time, so the build refuses to run without them rather than silently
# baking in localhost (docs/platform-v2/01-CURRENT-STATE-ASSESSMENT.md N-2).

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo

FROM base AS build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
RUN test -n "$NEXT_PUBLIC_API_URL" && test -n "$NEXT_PUBLIC_SITE_URL" \
    || (echo "NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SITE_URL build args are required" >&2 && exit 1)
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
# package.json too: Corepack reads the pinned pnpm from its "packageManager"
# field. Without it, Corepack downloads the newest pnpm instead.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --filter "@zgate/elearning-frontend..."
RUN pnpm --filter @zgate/elearning-frontend run build

# ---- prod: Next.js standalone output (mirrors the repo layout) ----
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
ENV NEXT_TELEMETRY_DISABLED=1
RUN groupadd --gid 1001 zgate && useradd --uid 1001 --gid zgate --shell /bin/false zgate
COPY --from=build --chown=zgate:zgate /repo/frontend/.next/standalone ./
COPY --from=build --chown=zgate:zgate /repo/frontend/.next/static ./frontend/.next/static
COPY --from=build --chown=zgate:zgate /repo/frontend/public ./frontend/public
USER zgate
ENV PORT=3003
ENV HOSTNAME=0.0.0.0
EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3003/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "frontend/server.js"]
