# Stage 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production NGINX (Unprivileged)
FROM nginxinc/nginx-unprivileged:alpine
# Copy the statically generated Vite assets to NGINX's serving directory
COPY --from=builder /app/dist /usr/share/nginx/html
# NGINX unprivileged images default to port 8080
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]