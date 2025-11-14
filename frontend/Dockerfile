# Multi-stage Dockerfile for Review GUI Frontend MVP
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check (using curl which is available in nginx:alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --spider --quiet http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

