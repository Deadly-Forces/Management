FROM node:20-alpine

WORKDIR /app

# Install build dependencies for sharp and tesseract native bindings
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/auth/health || exit 0

CMD ["node", "src/server.js"]
