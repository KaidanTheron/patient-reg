# Base image with pnpm enabled via Corepack
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# -----------------------------
# Development dependencies
# -----------------------------
FROM base AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN pnpm install --frozen-lockfile

# -----------------------------
# Production dependencies only
# -----------------------------
FROM base AS production-dependencies-env
COPY ./package.json ./pnpm-lock.yaml /app/
WORKDIR /app
RUN pnpm install --prod --frozen-lockfile

# -----------------------------
# Build stage
# -----------------------------
FROM base AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN pnpm run build

COPY ./package.json ./pnpm-lock.yaml /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules

WORKDIR /app

CMD ["pnpm", "run", "start"]