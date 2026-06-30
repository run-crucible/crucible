FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src ./src
COPY tsconfig.json ./

ENV NODE_ENV=production

CMD ["npx", "tsx", "src/index.ts"]
