# Multi-Stage Dockerfile for React Frontend Web Application
# Stage 1: Build static bundle with Node.js
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./
RUN npm install

# Copy application source
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve using Production Nginx Web Server
FROM nginx:alpine

# Copy built static artifacts from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port 80
EXPOSE 80

# Run Nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]
