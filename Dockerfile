# Install production and development dependencies
FROM node:20-alpine AS build-deps
RUN apk add --update dumb-init
USER node
WORKDIR /app
COPY --chown=node:node package.json package.json
COPY --chown=node:node package-lock.json package-lock.json
RUN npm install --frozen-lockfile

# Install production dependencies
FROM node:20-alpine AS prod-deps
USER node
WORKDIR /app
COPY --chown=node:node package.json package.json
COPY --chown=node:node package-lock.json package-lock.json
RUN npm install --omit=dev --frozen-lockfile

# Compile typescript source files
FROM build-deps AS build
USER node
WORKDIR /app
COPY --chown=node:node tsconfig.json tsconfig.json
COPY --chown=node:node src/ src/
RUN npm run build

# Combine production node_modules with build artifacts
FROM node:20-alpine AS runtime
RUN apk add --update dumb-init
USER node
WORKDIR /app
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist/
COPY --chown=node:node --from=build /app/package.json ./package.json
CMD [ "dumb-init", "node", "/app/dist/index.js" ]
