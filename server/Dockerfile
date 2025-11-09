FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Configure npm for better network handling and install dependencies
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --production

# Copy application code
COPY . .

# Expose port
EXPOSE 4000

# Start the application
CMD ["node", "index.js"]