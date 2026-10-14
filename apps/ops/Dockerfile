# Z-GATE operations portal (Next.js standalone) - client portal + staff
# console, feature-frozen per docs/platform-v2/07-MIGRATION-PLAN.md (D2).
#
# Build context is the REPOSITORY ROOT:
#   docker build -f apps/ops/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=https://... \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://... \
#     -t zgate-ops .
#
# NEXT_PUBLIC_* values are inlined into the client bundle, sitemap and CSP
# at build time, so this image is specific to one environment
# (docs/platform-v2/01-CURRENT-STATE-ASSESSMENT.md N-2). The build refuses
# to run without them rather than silently baking in localhost.

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
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --filter "@zgate/ops..."
RUN pnpm --filter @zgate/ops run build

# ---- prod: Next.js standalone output ----
# In a workspace the standalone tree mirrors the repo layout, so the
# server entry point is apps/ops/server.js (apps/ops/next.config.ts sets
# outputFileTracingRoot to the monorepo root).
FROM node:22-slim AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN groupadd --gid 1001 zgate && useradd --uid 1001 --gid zgate --shell /bin/false zgate
COPY --from=build --chown=zgate:zgate /repo/apps/ops/.next/standalone ./
COPY --from=build --chown=zgate:zgate /repo/apps/ops/.next/static ./apps/ops/.next/static
COPY --from=build --chown=zgate:zgate /repo/apps/ops/public ./apps/ops/public
USER zgate
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "apps/ops/server.js"]
