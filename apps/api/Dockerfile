FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8.15.4 --activate
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @ai-saas-admin/api prisma generate
RUN pnpm --filter @ai-saas-admin/api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/index.js"]


