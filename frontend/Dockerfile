# Multi-stage Dockerfile for Review GUI Frontend MVP
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for API configuration
# These MUST be set as build args from docker-compose.yml
# Vite embeds these at build time - they become part of the JavaScript bundle
ARG VITE_API_BASE_URL
ARG VITE_API_KEY

# Convert ARG to ENV so Vite can access them during build
# Vite only sees environment variables, not build arguments
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_KEY=$VITE_API_KEY

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source files
COPY . .

# Build the application with the API URL
# Verify environment variables are set and correct before building
# IMPORTANT: Vite only embeds env vars that start with VITE_ and are available at build time
RUN echo "=== Build Environment Variables ===" && \
    echo "VITE_API_BASE_URL=$VITE_API_BASE_URL" && \
    echo "VITE_API_KEY length: $(echo -n "$VITE_API_KEY" | wc -c)" && \
    echo "Printing all VITE_ env vars:" && \
    env | grep VITE_ || echo "No VITE_ env vars found!" && \
    if [ -z "$VITE_API_KEY" ]; then \
        echo "ERROR: VITE_API_KEY is not set!" && exit 1; \
    fi && \
    if [ "$VITE_API_BASE_URL" != "http://localhost:8080" ]; then \
        echo "ERROR: VITE_API_BASE_URL is not http://localhost:8080 (got: $VITE_API_BASE_URL)" && exit 1; \
    fi && \
    echo "=== Starting Vite Build ===" && \
    npm run build && \
    echo "=== Build Complete ===" && \
    echo "Verifying embedded values in built files..." && \
    echo "Checking for localhost:8080:" && \
    (grep -q "localhost:8080" dist/assets/*.js 2>/dev/null && echo "✅ localhost:8080 found" || echo "❌ localhost:8080 NOT found") && \
    echo "Checking for host.docker.internal:" && \
    (grep -q "host.docker.internal" dist/assets/*.js 2>/dev/null && echo "❌ WARNING: host.docker.internal found (should not be there!)" || echo "✅ host.docker.internal not found (good)") && \
    echo "Checking for :8000:" && \
    (grep -q ":8000" dist/assets/*.js 2>/dev/null && echo "❌ WARNING: :8000 found (should not be there!)" || echo "✅ :8000 not found (good)")

# Stage 2: Production
FROM nginx:alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy runtime configuration file (can be updated without rebuild)
COPY public/config.js /usr/share/nginx/html/config.js

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check (using curl which is available in nginx:alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --spider --quiet http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
