# Use Node.js LTS version
FROM --platform=linux/amd64 node:lts-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript files
RUN npm run build

# Expose application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
