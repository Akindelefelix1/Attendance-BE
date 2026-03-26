FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$RUN_SEED_ON_START\" = \"true\" ]; then npm run db:seed; fi && node dist/src/main"]
