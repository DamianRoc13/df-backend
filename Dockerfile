# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and Prisma schema
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine

# Install pnpm and required system dependencies
RUN npm install -g pnpm && \
    apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY --chown=nestjs:nodejs package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy Prisma schema and migrations
COPY --chown=nestjs:nodejs prisma ./prisma

# Generate Prisma Client for production
RUN npx prisma generate

# Copy built application from builder
COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api', (r) => {process.exit(r.statusCode === 404 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/main.js"]
