FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN apk add --no-cache openssl
RUN npx prisma generate

# Expose the chat/socket port
EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node index.js"]