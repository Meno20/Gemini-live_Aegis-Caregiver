FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

COPY server/ ./server/

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["bun", "server/signaling-server.js"]
