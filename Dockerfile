# Multi-stage build for the full-stack application
FROM node:18-alpine AS base

# Install Python and pip
RUN apk add --no-cache python3 py3-pip

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pyproject.toml ./
COPY requirements*.txt ./

# Install Node.js dependencies
RUN npm ci --only=production

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install Python and pip
RUN apk add --no-cache python3 py3-pip

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./

# Copy Python files
COPY --from=base /app/*.py ./
COPY --from=base /app/requirements*.txt ./
COPY --from=base /app/pyproject.toml ./

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Create necessary directories
RUN mkdir -p uploads cbse_validation_db chroma_db_electricity

# Expose ports
EXPOSE 3000 8001 4444

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"] 