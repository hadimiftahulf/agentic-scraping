FROM node:20-alpine

# Install Playwright browsers
RUN npx -y playwright install chromium

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy source files
COPY src ./src

# Install dependencies
RUN npm ci --only=production

# Build TypeScript
RUN npm run build

# Create directories for screenshots and sessions
RUN mkdir -p /app/screenshots /app/session

# Set environment to production
ENV NODE_ENV=production

# Run the worker
CMD ["node", "dist/worker.js"]
