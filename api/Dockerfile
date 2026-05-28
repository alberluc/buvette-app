FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY knexfile.js server.js db.js ./
COPY lib ./lib
COPY middleware ./middleware
COPY routes ./routes
COPY migrations ./migrations
EXPOSE 3000
CMD ["sh", "-c", "npx knex migrate:latest && node server.js"]
