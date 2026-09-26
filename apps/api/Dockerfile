# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS dependencies

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci

FROM dependencies AS builder
COPY apps/api ./apps/api
RUN npm run db:generate && npm run build:api

FROM node:22-bookworm-slim AS runner
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production

# Copy the builder's dependency tree because `prisma generate` writes the
# schema-specific client into node_modules during the builder stage.
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /app/apps/api/prisma ./apps/api/prisma
COPY --chown=node:node docker/api-entrypoint.sh ./docker/api-entrypoint.sh

RUN chmod +x ./docker/api-entrypoint.sh
USER node
EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD curl --fail --silent http://localhost:4000/health > /dev/null || exit 1

ENTRYPOINT ["./docker/api-entrypoint.sh"]
