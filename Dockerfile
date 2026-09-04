# Multi-stage build for Android ADB MCP Server.
# Used by Glama (glama.ai/mcp/servers) health checks and by container users.
# The stdio server needs no port, no secrets and no device to start:
# introspection (initialize + tools/list) works without ADB.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
ENTRYPOINT ["node", "dist/index.js"]
