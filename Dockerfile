FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["sh", "-c", "FAILED_MIGRATION_NAME=${FAILED_MIGRATION_NAME:-20260326100500_init}; npx prisma migrate resolve --rolled-back $FAILED_MIGRATION_NAME || true; npx prisma migrate deploy && if [ \"$RUN_SEED_ON_START\" = \"true\" ]; then npm run db:seed; fi && node dist/src/main"]
