FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY api/auth/package.json ./api/auth/
COPY shared/package.json ./shared/

# El corepack mira la versión especificada en package.json y la instala automáticamente, mejor que usar npm i -g pnpm y tener que cambiarlo a cada versión
RUN corepack enable && corepack prepare --activate && pnpm install --frozen-lockfile --ignore-scripts

COPY . .
WORKDIR /app/shared
RUN pnpm build

WORKDIR /app/api/auth
RUN pnpm prisma:generate && pnpm build

FROM node:24-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/api/auth/package.json ./api/auth/
COPY --from=builder /app/shared/package.json ./shared/

COPY --from=builder /app/api/auth/dist ./dist
COPY --from=builder /app/api/auth/src/generated/prisma/ ./src/generated/prisma/
COPY --from=builder /app/api/auth/prisma/ ./prisma/
COPY --from=builder /app/shared/dist ./shared/dist


RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile --ignore-scripts

EXPOSE 3000

USER node

CMD ["node", "dist/main.js"]
