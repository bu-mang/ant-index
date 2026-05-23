# Ant-Index (개미지표)

한국 주식 커뮤니티(네이버·토스 종목토론실)의 글을 크롤링하고 LLM 감성분석하여 시장 심리 지표(ㅅㅂ지수, 가즈아지수)를 산출하는 프로젝트.

## 프로젝트 구조

```
ant-index/
├── server/          # NestJS 백엔드 (지표 계산 + REST API)
├── crawler/         # Python 크롤러 (데이터 수집 + 감성분석)
├── web/             # Next.js 프론트엔드 (대시보드) — 미착수
├── docs/
│   ├── PLAN.md          # 전체 설계 문서 (지표 산출 공식, UI 와이어프레임 등)
│   └── IMPLEMENT.md     # 구현 진행 내역
└── docker-compose.yml
```

## 기술 스택

| 영역 | 스택 |
|------|------|
| DB | PostgreSQL 16 (Docker, 포트 5433) |
| 백엔드 | NestJS + Drizzle ORM |
| 크롤러 | Python (requests + BS4 + Playwright) + SQLAlchemy Core |
| 감성분석 | Gemini 2.5 Flash-Lite API (무료 티어) — `SENTIMENT_PROVIDER=ollama`로 로컬 폴백 가능 |
| 프론트엔드 | Next.js + shadcn/ui + Tailwind CSS (예정) |

## 데이터 흐름

```
Python 크롤러 (cron) → 글 수집 → Gemini API 감성 분류 → PostgreSQL
                                                        ↓
Next.js 대시보드 ← REST API ← NestJS (지표 계산)
```

## DB 접근

- **Drizzle ORM** (NestJS): 스키마 정의의 source of truth + 마이그레이션 관리 + API
- **SQLAlchemy Core** (Python): 같은 DB에 INSERT 위주 + 중복 체크 SELECT
- DDL은 Drizzle이 관리, SQLAlchemy는 reflection으로 테이블 읽음

## 실행 방법

자주 쓰는 명령은 루트 `Makefile`에 다 묶여 있다 (`make help` 로 목록 확인).

```bash
# 최초 셋업 — 세 서비스 의존성 일괄 설치
make install            # = install-crawler + install-server + install-web
# 또는 개별:
make install-crawler    # pip install (crawler/requirements.txt)
make install-server     # npm install (server/)
make install-web        # npm install (web/)

# DB + 도커 컨테이너
make up           # docker compose up -d (db + crawler + analyzer)
make down
make logs         # 실시간 로그 팔로우

# 크롤러 (로컬 venv 사용)
make seed         # stocks 30개 시드
make crawl        # 1회 글 크롤링
make analyze      # 1회 감성분석 + 한줄평
make loop         # 30분 주기 무한 반복

# 서버 / 웹 / 마이그레이션
make server
make web
make migrate-gen && make migrate
```

또는 명령을 풀어서 실행해도 동일:
```bash
docker compose up -d
cd server && npm install && npm run start:dev
cd crawler && pip install -r requirements.txt && python main.py
cd server && npx drizzle-kit generate && npx drizzle-kit migrate
```

## 주요 파일

- `server/src/database/schema.ts` — DB 스키마 정의 (5개 테이블)
- `server/src/database/database.module.ts` — Drizzle Provider + NestJS DI 등록
- `crawler/main.py` — typer 기반 CLI 디스패처 (얇음, 비즈니스 로직 없음)
- `crawler/antindex/jobs/{crawl,analyze,price,loop}.py` — 작업 단위별 진입점
- `crawler/antindex/scrapers/naver.py` — 네이버증권 종목토론실 크롤러
- `crawler/antindex/db.py` — SQLAlchemy 설정 (reflection 방식)
- `crawler/antindex/sentiment/llm.py` — LLM 호출 추상화 (Gemini API ↔ Ollama, SENTIMENT_PROVIDER로 전환)
- `crawler/antindex/sentiment/analyzer.py` — 감성분석 프롬프트 + 배치 호출
- `crawler/antindex/logging_config.py` — 중앙 logging 설정 (엔트리포인트에서 setup_logging() 호출)
- `crawler/tests/test_sentiment.py` — 배치 감성분석 테스트

## 현재 진행 상태

Phase 1 (MVP) 진행 중. 상세 내역은 docs/IMPLEMENT.md 참조.

- [x] 감성분석 방식 선정 (Gemini 2.5 Flash-Lite API 무료 티어 — Exaone 로컬은 폴백으로 유지)
- [x] 종목 30개 선정
- [x] PostgreSQL + Docker Compose
- [x] DB 스키마 정의 (Drizzle)
- [x] 네이버증권 크롤러
- [x] NestJS + DatabaseModule 설정
- [ ] Drizzle 마이그레이션 실행
- [ ] 종목 시드 데이터 삽입
- [ ] 크롤링 → DB 저장 파이프라인
- [ ] 감성분석 파이프라인
- [ ] 지표 계산 로직
- [ ] REST API
- [ ] Next.js 대시보드

## 컨벤션

- 커밋 메시지: 한국어 OK
- 서버: TypeScript strict, NestJS 모듈 구조
- 크롤러: Python 3.x, SQLAlchemy Core (ORM 레이어 미사용)
- **프론트엔드**: `.claude/agents/frontend.md` 참조 (컬러 시스템, 컴포넌트 패턴, 레이아웃 등)
- 스키마 변경은 반드시 `server/src/database/schema.ts`에서 먼저 수정 → `drizzle-kit generate`로 마이그레이션 생성
