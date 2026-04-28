FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Install all dependencies (dev included — needed to compile TypeScript)
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN pnpm install --frozen-lockfile

# Compile the backend
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY pnpm-workspace.yaml package.json ./
COPY apps/backend ./apps/backend
WORKDIR /app/apps/backend
RUN pnpm build

# Production image — install only production dependencies
FROM node:22-alpine AS production
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN pnpm install --prod
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["sh", "-c", "pnpm run migration:run:prod && node dist/main"]
