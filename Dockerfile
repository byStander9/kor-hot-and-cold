FROM node:22-alpine AS dependencies

WORKDIR /app/apps/web

COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/apps/web

COPY --from=dependencies /app/apps/web/node_modules ./node_modules
COPY apps/web ./
COPY data/demo /app/data/demo

RUN npm run build

FROM node:22-alpine AS runner

ENV HOME=/home/node \
    HOSTNAME=0.0.0.0 \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=7860

USER node
WORKDIR /home/node/app

COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/apps/web/public ./public
COPY --from=builder --chown=node:node /app/data/demo ./data/demo

EXPOSE 7860

CMD ["node", "server.js"]
