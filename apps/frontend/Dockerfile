FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Install all dependencies (dev included — needed to build with Vite)
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN pnpm install --frozen-lockfile

# Build the frontend
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY pnpm-workspace.yaml package.json ./
COPY apps/frontend ./apps/frontend
WORKDIR /app/apps/frontend
RUN pnpm build

# Production image — install only production dependencies
FROM node:22-alpine AS production
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN pnpm install --prod
COPY --from=build /app/apps/frontend/build ./apps/frontend/build
WORKDIR /app/apps/frontend
EXPOSE 5173
CMD ["pnpm", "start"]
