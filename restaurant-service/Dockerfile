# Stage 1: Builder
FROM node:18-alpine AS builder
WORKDIR /app
# Copy package files and install ALL dependencies (including dev for any build scripts)
COPY package*.json ./
RUN npm ci
# Copy source code
COPY . .
# If you have a build step (like TypeScript), run it here: RUN npm run build
# Remove devDependencies to prepare for production
RUN npm prune --production

# Stage 2: Production Runner
FROM node:18-alpine
ENV NODE_ENV=production
# Install dumb-init for proper signal handling and graceful shutdowns
RUN apk add --no-cache dumb-init
WORKDIR /app
# Copy strictly what's needed from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
# Adjust this to point to your actual source directory/entry file
COPY --from=builder /app/ ./ 
# Switch to the restricted built-in 'node' user for security
USER node
EXPOSE 3001
CMD ["dumb-init", "node", "index.js"]