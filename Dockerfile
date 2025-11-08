# Frontend build
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built frontend
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/package*.json ./
COPY --from=frontend-builder /app/next.config.mjs ./

RUN npm ci --only=production

EXPOSE 3000

ENV NEXT_PUBLIC_NAKAMA_URL=http://localhost:7350
ENV NODE_ENV=production

CMD ["npm", "start"]
