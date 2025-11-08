FROM node:20-alpine AS base

WORKDIR /app

# Copy Nakama binaries and configs
COPY nakama.yml .
COPY modules/ modules/

# Install dependencies for TypeScript compilation
RUN npm install -g ts-node typescript

EXPOSE 7350 7349 9100

CMD ["nakama", "--config", "nakama.yml"]
