FROM node:22-slim
WORKDIR /srv
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ ./
COPY web/ ./public/
ENV NODE_ENV=production
CMD ["node", "index.js"]
