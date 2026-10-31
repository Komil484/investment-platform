# Stage 1: build
FROM node:22-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: run
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# The production database lives here, in a volume (see docker-compose.yml).
RUN mkdir -p /app/data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Stop straight away if the login secret is missing, then apply migrations and start the app.
CMD ["sh", "-c", "if [ -z \"$AUTH_SECRET\" ]; then echo 'AUTH_SECRET is not set. Add it to .env.production.' >&2; exit 1; fi; npx prisma migrate deploy && npm start"]