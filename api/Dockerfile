FROM node:22-alpine
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY knexfile.js server.js db.js ./
COPY lib ./lib
COPY middleware ./middleware
COPY routes ./routes
COPY migrations ./migrations
COPY seeds ./seeds
COPY jobs ./jobs
EXPOSE 3000
CMD ["sh", "-c", "npx knex migrate:latest && node server.js"]
