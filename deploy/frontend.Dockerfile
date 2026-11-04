# Stage 1: Build frontend bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Cache package dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# Copy existing frontend source code (read-only)
COPY frontend/ ./
ENV VITE_API_BASE_URL=/api/v1
RUN npm run build

# Stage 2: Production Nginx web server
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
