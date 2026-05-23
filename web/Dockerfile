# syntax=docker/dockerfile:1
# Next.js standalone production image — output: 'standalone' 가 next.config 에
# 박혀 있어야 .next/standalone 이 생성된다.

# ─── 1) deps: 의존성 설치만 ─────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ─── 2) builder: next build ─────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* 는 빌드 타임에 번들로 인라인되므로 ARG 로 받는다.
# docker-compose 의 build.args 에서 주입 (기본값은 로컬 dev).
ARG NEXT_PUBLIC_API_URL=http://localhost:3333/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ─── 3) runner: 최소 standalone 서버 ───────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3030

# standalone 폴더는 server.js + 필요한 node_modules 만 포함.
# .next/static 과 public 은 standalone 이 자동으로 안 담아주므로 수동 복사.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3030
CMD ["node", "server.js"]
