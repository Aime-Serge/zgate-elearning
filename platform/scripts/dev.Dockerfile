# Shared development image for every Node service in docker-compose.yml.
# Source is bind-mounted at /repo; dependencies live in named volumes so
# the container's Linux node_modules never mix with the host's.
FROM node:22-slim
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@10.34.6 --activate
WORKDIR /repo
