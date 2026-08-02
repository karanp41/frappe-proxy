# Dockerfile for the Frappe proxy Node.js service
FROM node:20-alpine

WORKDIR /app

# Copy dependency manifest and install dependencies
COPY package.json ./
RUN npm install

# Copy application source
COPY . .

# Expose the port the app listens on (default 8081, overridable via PORT env var)
EXPOSE 8081

# Run the proxy server directly (PM2 is not used inside the container)
CMD ["node", "server.js"]
