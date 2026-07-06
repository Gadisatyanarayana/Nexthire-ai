FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends docker.io ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN npm install --no-package-lock --no-audit --no-fund bullmq ioredis tsx

COPY . .

CMD ["npx", "tsx", "--tsconfig", "tsconfig.worker.json", "src/workers/judgeWorker.ts"]
