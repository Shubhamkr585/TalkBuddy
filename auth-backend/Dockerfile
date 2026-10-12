# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy ONLY package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code (Make sure .env and node_modules are in .dockerignore)
COPY . .

# Install OpenSSL for Prisma and generate Prisma Client
RUN apk add --no-cache openssl
RUN npx prisma generate

# Expose the auth port
EXPOSE 4000

# Start the server (push schema then start)
CMD ["sh", "-c", "npx prisma db push && node index.js"]