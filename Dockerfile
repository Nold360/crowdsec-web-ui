# Dockerfile
FROM node:20-alpine

# Install the Docker CLI so docker commands can be executed
RUN apk update && apk add --no-cache docker-cli

# Set working directory
WORKDIR /app

# Copy root package files and install backend dependencies
COPY package*.json ./
RUN npm install

# Copy frontend package files and install frontend dependencies
# We copy this separately to leverage Docker cache
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy the rest of the application code
COPY . .

# Build the frontend
RUN npm run build-ui

# Expose port 3000
EXPOSE 3000

# Run the application
CMD ["npm", "start"]
