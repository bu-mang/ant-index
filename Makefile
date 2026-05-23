# Ant-Index 개발 명령 모음
#
# 사용법: make <target> (예: make crawl, make up)
# 사용 가능한 명령 목록: make help
#
# 크롤러는 venv 안의 Python 을 명시적으로 호출 (시스템 Python 오염 방지).
VENV_PY := $(CURDIR)/crawler/venv/bin/python

.PHONY: help \
        install install-crawler install-server install-web \
        seed test \
        crawl analyze price loop \
        up down logs ps \
        server web \
        migrate migrate-gen

help: ## 사용 가능한 명령 목록 출력
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z][a-zA-Z_-]*:.*?## / {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ─── 의존성 설치 ────────────────────────────────────────────────────────────

install: install-crawler install-server install-web ## 세 서비스 의존성 일괄 설치 (최초 셋업)

install-crawler: ## crawler 의존성 설치 (pip)
	cd crawler && pip install -r requirements.txt

install-server: ## server 의존성 설치 (npm)
	cd server && npm install

install-web: ## web 의존성 설치 (npm)
	cd web && npm install

# ─── 크롤러 ─────────────────────────────────────────────────────────────────

seed: ## stocks 마스터 30종목 1회 시드
	cd crawler && $(VENV_PY) seed.py

test: ## 감성분석 분류 정확도 회귀 테스트
	cd crawler && $(VENV_PY) -m tests.test_sentiment

crawl: ## 글 크롤링 1회
	cd crawler && $(VENV_PY) main.py crawl

analyze: ## 감성분석 + 한줄평 1회
	cd crawler && $(VENV_PY) main.py analyze

price: ## 시세 크롤링 1회
	cd crawler && $(VENV_PY) main.py price

loop: ## 크롤링+분석(30분) + 시세(5분) 무한 반복
	cd crawler && $(VENV_PY) main.py loop

# ─── Docker ─────────────────────────────────────────────────────────────────

up: ## docker compose up -d (db + crawler + analyzer)
	docker compose up -d

down: ## docker compose down
	docker compose down

logs: ## docker compose logs -f (실시간 로그 팔로우)
	docker compose logs -f

ps: ## 컨테이너 상태 보기
	docker compose ps

# ─── 서버 / 웹 ───────────────────────────────────────────────────────────────

server: ## NestJS 서버 개발 모드 실행
	cd server && npm run start:dev

web: ## Next.js 프론트 개발 모드 실행
	cd web && npm run dev

# ─── DB 마이그레이션 ─────────────────────────────────────────────────────────

migrate-gen: ## 스키마 변경 감지하여 마이그레이션 SQL 생성
	cd server && npx drizzle-kit generate

migrate: ## 생성된 마이그레이션 적용
	cd server && npx drizzle-kit migrate
