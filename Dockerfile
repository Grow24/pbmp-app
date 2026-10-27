FROM node:20-alpine

RUN apk add --no-cache python3 php openjdk21-jdk \
 && ln -sf "$(command -v python3)" /usr/local/bin/python3 \
 && ln -sf "$(command -v php || command -v php84 || command -v php83)" /usr/local/bin/php \
 && ln -sf /usr/lib/jvm/java-21-openjdk/bin/java /usr/local/bin/java \
 && ln -sf /usr/lib/jvm/java-21-openjdk/bin/javac /usr/local/bin/javac \
 && python3 -c 'print(1)' && php -r 'echo 1;' && javac -version

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci --include=dev --no-audit --no-fund

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server/index.js"]
