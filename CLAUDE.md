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
| 감성분석 | Ollama + Exaone 3.5 2.4B (로컬 LLM, 비용 $0) |
| 프론트엔드 | Next.js + shadcn/ui + Tailwind CSS (예정) |

## 데이터 흐름

```
Python 크롤러 (cron) → 글 수집 → Exaone 감성 분류 → PostgreSQL
                                                        ↓
Next.js 대시보드 ← REST API ← NestJS (지표 계산)
```

## DB 접근

- **Drizzle ORM** (NestJS): 스키마 정의의 source of truth + 마이그레이션 관리 + API
- **SQLAlchemy Core** (Python): 같은 DB에 INSERT 위주 + 중복 체크 SELECT
- DDL은 Drizzle이 관리, SQLAlchemy는 reflection으로 테이블 읽음

## 실행 방법

```bash
# DB 실행
docker compose up -d

# 서버
cd server && npm install && npm run start:dev

# 크롤러
cd crawler && pip install -r requirements.txt && python main.py

# 마이그레이션 (스키마 변경 시)
cd server && npx drizzle-kit generate && npx drizzle-kit migrate
```

## 주요 파일

- `server/src/database/schema.ts` — DB 스키마 정의 (5개 테이블)
- `server/src/database/database.module.ts` — Drizzle Provider + NestJS DI 등록
- `crawler/sources/naver.py` — 네이버증권 종목토론실 크롤러
- `crawler/db.py` — SQLAlchemy 설정 (reflection 방식)
- `crawler/test_sentiment.py` — Exaone 감성분석 테스트

## 현재 진행 상태

Phase 1 (MVP) 진행 중. 상세 내역은 docs/IMPLEMENT.md 참조.

- [x] 감성분석 방식 선정 (Exaone 3.5 2.4B)
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
