# Multi-stage lightweight Node.js environment
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# -------------------------------------------------------------
# Development Stage: includes devDependencies (nodemon)
# -------------------------------------------------------------
FROM base AS dev
RUN npm install
COPY . .
RUN mkdir -p /app/data
ENV NODE_ENV=development
ENV PORT=5001
ENV DATA_DIR=/app/data
EXPOSE 5001
CMD ["npm", "run", "dev"]

# -------------------------------------------------------------
# Production Stage: minimal footprint, only production deps
# -------------------------------------------------------------
FROM base AS prod
RUN npm install --omit=dev
COPY . .
RUN mkdir -p /app/data
ENV NODE_ENV=production
ENV PORT=5001
ENV DATA_DIR=/app/data
EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5001/api/health || exit 1

CMD ["node", "src/app.js"]
