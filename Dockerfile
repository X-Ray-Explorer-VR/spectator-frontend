FROM node:22-alpine AS deps

COPY package*.json ./

RUN npm install

FROM node:22-alpine As builder

COPY . .
COPY --from=deps /node_modules ./node_modules

RUN npm run build

FROM node:22-alpine AS runner

COPY --from=builder /next.config.ts ./
COPY --from=builder /public ./public
COPY --from=builder /node_modules ./node_modules
COPY --from=builder /.next ./.next

ENV PORT=80
ENV HOSTNAME="0.0.0.0"

EXPOSE ${PORT}

CMD ["node_modules/.bin/next", "start"]
