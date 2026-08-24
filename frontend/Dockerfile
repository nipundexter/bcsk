# BCSK web — Next.js standalone output, so the runtime image ships only what it needs.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* are inlined at build time, so the API URL must be present here, not at runtime.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache tini && addgroup -S bcsk && adduser -S bcsk -G bcsk

# `output: "standalone"` emits a self-contained server plus only the used node_modules.
COPY --from=build --chown=bcsk:bcsk /app/.next/standalone ./
COPY --from=build --chown=bcsk:bcsk /app/.next/static     ./.next/static
COPY --from=build --chown=bcsk:bcsk /app/public           ./public

USER bcsk
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
