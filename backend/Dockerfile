# syntax=docker/dockerfile:1
#
# Backend (Express + Mongoose) image for Dokploy.
#
# IMPORTANT: build with the REPOSITORY ROOT as the build context so the shared
# pnpm workspace lockfile is available. In Dokploy set:
#   - Build Type:      Dockerfile
#   - Docker File:     backend/Dockerfile
#   - Build Context:   . (repository root — the default)
#
# Multi-stage: install + compile TypeScript, then ship a slim production image
# containing only prod dependencies and the compiled dist/.

FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---- build stage -----------------------------------------------------------
FROM base AS build
# Toolchain for native modules (bcrypt).
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Copy only manifests first for a well-cached install layer.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

# Install backend deps only (skips the frontend's toolchain).
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm --filter ./backend install --frozen-lockfile

# Build the backend.
COPY backend ./backend
RUN pnpm --filter ./backend run build

# Produce a self-contained, production-only bundle in /app/out
# (package.json + pruned node_modules + compiled dist/). --legacy is required
# since pnpm v10 only deploys injected workspaces by default.
RUN pnpm --filter ./backend deploy --prod --legacy /app/out

# ---- runtime stage ---------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/out ./

# The app reads PORT from the environment (default 3000). Dokploy maps this.
EXPOSE 3000

CMD ["node", "dist/server.js"]
