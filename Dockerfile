# Use Node.js LTS version
FROM --platform=linux/amd64 node:lts-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

RUN npm install -g pm2

RUN npm install -g prisma

# Copy source code
COPY . .

# Build TypeScript files
RUN npm run build

# Expose application port
EXPOSE 3000

# Start the application
CMD ["pm2-runtime", "ecosystem.config.js"]
