# Build stage
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source files
COPY tsconfig.json .
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built files from builder stage
COPY --from=builder /build/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV TZ=${TZ:-Asia/Singapore}

# Expose any needed ports (if applicable)
# EXPOSE 3000

# Run the application
CMD ["npm", "start"] 