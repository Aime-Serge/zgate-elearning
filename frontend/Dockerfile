# Z-GATE Academy Online - e-learning frontend (Next.js standalone).
#
# Build context is the REPOSITORY ROOT:
#   docker build -f elearning/frontend/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=https://... \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://... \
#     -t zgate-elearning-frontend .
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
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --filter "@zgate/elearning-frontend..."
RUN pnpm --filter @zgate/elearning-frontend run build

# ---- prod: Next.js standalone output (mirrors the repo layout) ----
FROM node:22-slim AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN groupadd --gid 1001 zgate && useradd --uid 1001 --gid zgate --shell /bin/false zgate
COPY --from=build --chown=zgate:zgate /repo/elearning/frontend/.next/standalone ./
COPY --from=build --chown=zgate:zgate /repo/elearning/frontend/.next/static ./elearning/frontend/.next/static
COPY --from=build --chown=zgate:zgate /repo/elearning/frontend/public ./elearning/frontend/public
USER zgate
ENV PORT=3003
ENV HOSTNAME=0.0.0.0
EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3003/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "elearning/frontend/server.js"]
