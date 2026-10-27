FROM node:20-alpine

RUN apk add --no-cache python3 php openjdk21-jdk

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci --include=dev --no-audit --no-fund

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server/index.js"]
