FROM node:20-alpine

RUN apk add --no-cache python3 php openjdk21-jdk \
 && ln -sf /usr/lib/jvm/java-21-openjdk/bin/java /usr/local/bin/java \
 && ln -sf /usr/lib/jvm/java-21-openjdk/bin/javac /usr/local/bin/javac

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci --include=dev --no-audit --no-fund

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server/index.js"]
