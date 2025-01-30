FROM node:20-alpine AS base
RUN apk add --update dumb-init
USER node
WORKDIR /app
COPY --chown=node:node package.json package.json
COPY --chown=node:node package-lock.json package-lock.json
RUN npm install --frozen-lockfile --no-optional

# Install production dependencies only
FROM node:17-alpine AS deps
USER node
WORKDIR /app
COPY --chown=node:node package.json package.json
COPY --chown=node:node package-lock.json package-lock.json
RUN npm install --omit=dev --frozen-lockfile

# Compile typescript sources
FROM base AS build
USER node
WORKDIR /app
COPY --chown=node:node tsconfig.json tsconfig.json
COPY --chown=node:node src/ src/
RUN npm run build

# Combine production only node_modules with compiled javascript files.
FROM node:17-alpine AS final
RUN apk add --update dumb-init
USER node
WORKDIR /app
COPY --chown=node:node --from=deps /app/node_modules ./app/node_modules
COPY --chown=node:node --from=build /app/dist/src ./dist/
COPY --chown=node:node --from=build /app/package.json ./
CMD [ "dumb-init", "node", "/app/dist/index.js" ]
