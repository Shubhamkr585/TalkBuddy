FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expose the gateway port
EXPOSE 5100

CMD ["node", "index.js"]