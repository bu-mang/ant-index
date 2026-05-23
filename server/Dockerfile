# syntax=docker/dockerfile:1
# NestJS production image — nest build → dist/main 실행.

# ─── 1) deps: 전체 의존성 (build 에 devDeps 필요) ────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ─── 2) builder: nest build → dist/ ───────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─── 3) runner: production deps + dist/ 만 ────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3333

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3333
CMD ["node", "dist/main"]
