FROM node:22-slim AS web
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx expo export --platform web

FROM node:22-slim
WORKDIR /srv
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ ./
COPY --from=web /app/dist ./public
ENV NODE_ENV=production
CMD ["node", "index.js"]
