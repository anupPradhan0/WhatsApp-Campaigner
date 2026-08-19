# syntax=docker/dockerfile:1
#
# Frontend (Vite + React) image for Dokploy — static build served by nginx.
#
# IMPORTANT: build with the REPOSITORY ROOT as the build context so the shared
# pnpm workspace lockfile is available. In Dokploy set:
#   - Build Type:      Dockerfile
#   - Docker File:     frontend/Dockerfile
#   - Build Context:   . (repository root — the default)
#
# No build args needed. The SPA calls /api on its own origin, and Traefik
# path-routes /api to the backend container — see frontend/nginx.conf.

FROM node:20-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Copy only manifests first for a well-cached install layer.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

# Install frontend deps only.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm --filter ./frontend install --frozen-lockfile

COPY frontend ./frontend
RUN pnpm --filter ./frontend run build

# ---- runtime stage ---------------------------------------------------------
FROM nginx:1.27-alpine AS runtime
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
