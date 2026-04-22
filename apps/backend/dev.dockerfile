FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /backend

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

CMD ["pnpm", "run", "start:dev"]