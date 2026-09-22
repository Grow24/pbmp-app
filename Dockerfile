FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
# Zeabur injects NODE_ENV=production into the image build, which would skip
# typescript/vite (devDependencies). Always install them for `npm run build`.
RUN npm ci --include=dev

COPY . .
RUN npm run build
RUN npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server/index.js"]
