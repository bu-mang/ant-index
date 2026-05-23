# Ant-Index Server

크롤러가 PostgreSQL 에 누적한 데이터를 **REST API 로 제공**하는 NestJS 서버.
프론트엔드 대시보드([../web](../web))가 이 API 를 호출해 차트·통계·한줄평을 렌더링한다.

- **NestJS 11** + **Drizzle ORM 0.45** + **PostgreSQL 16**
- Swagger 자동 문서화 (`GET /docs`)
- 모든 엔드포인트는 `/api` 프리픽스 + CORS 활성
- 크롤러와 같은 DB 를 읽기만 함 — 쓰기는 크롤러만 담당

## Quick Start

```bash
# 의존성 설치 (세 서비스 일괄: make install / server 만: make install-server)
make install-server

# 개발 서버 (hot reload)
make server    # 또는: cd server && npm run start:dev

# 프로덕션 빌드 + 실행
cd server && npm run build && npm run start:prod
```

서버 기본 포트는 `3000` (환경변수 `PORT` 로 override). Swagger UI 는
[http://localhost:3000/docs](http://localhost:3000/docs).

## 환경변수

루트 `.env` 또는 `server/.env` 에서 로딩 (`dotenv/config`):

```env
DATABASE_URL=postgresql://antindex:antindex2026@localhost:5433/antindex
PORT=3000
```

## 디렉토리 구조

```
server/
├── src/
│   ├── main.ts                       # 🚀 진입점 — Nest factory + CORS + Swagger setup
│   ├── app.module.ts                 # 루트 모듈 (Database/Stocks/Index 모듈 조립)
│   ├── app.controller.ts             # health check 등
│   ├── app.service.ts
│   │
│   ├── database/                     # 🗄️  DB 인프라
│   │   ├── schema.ts                 #   ⭐ Drizzle 스키마 (5개 테이블) — Single Source of Truth
│   │   └── database.module.ts        #   Drizzle Provider DI 등록 (DATABASE_TOKEN)
│   │
│   ├── stocks/                       # 📊 종목 API — GET /api/stocks
│   │   ├── stocks.controller.ts
│   │   ├── stocks.module.ts
│   │   ├── stocks.service.ts
│   │   └── dto/                      #   응답 DTO (Swagger 자동 문서화용)
│   │
│   └── index/                        # ⭐ 지표 API — GET /api/stocks/:code/... + /api/market/...
│       ├── index.controller.ts       #   StockIndexController + MarketController 둘 다
│       ├── index.module.ts
│       ├── index.service.ts          #   가장 큰 서비스 — 지수/히스토리/통계/한줄평/핫댓글 모두
│       └── dto/                      #   응답 DTO 모음
│
├── drizzle/                          # 📜 자동 생성된 마이그레이션 SQL + 메타
│   ├── meta/
│   └── *.sql
│
├── drizzle.config.ts                 # drizzle-kit 설정 (schema 위치, out 디렉토리)
├── nest-cli.json                     # NestJS CLI 빌드 설정
└── tsconfig.json                     # TypeScript strict 모드
```

## API 엔드포인트

전부 `/api` 프리픽스. 자세한 스펙은 `/docs` (Swagger) 참조.

### 종목 (`stocks` 모듈)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/stocks` | 활성 종목 목록 + 최신 지표값 + 시세 |

### 지표 — 종목별 (`index` 모듈, `StockIndexController`)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/stocks/:code/sb` | ㅅㅂ지수 현재값 |
| GET | `/api/stocks/:code/sb/history?period=7d\|30d\|90d` | ㅅㅂ지수 시계열 |
| GET | `/api/stocks/:code/gazua` | 가즈아지수 현재값 |
| GET | `/api/stocks/:code/gazua/history?period=...` | 가즈아지수 시계열 |
| GET | `/api/stocks/:code/ant-index` | 통합 개미지표 (0=공포, 100=탐욕) |
| GET | `/api/stocks/:code/ant-index/history?period=...` | 통합 지표 시계열 |
| GET | `/api/stocks/:code/price` | 최신 시세 + 투자지표(시총/PER/PBR/배당/52주 고저) |
| GET | `/api/stocks/:code/hot-comments?limit=10` | 핫댓글 (좋아요 상위, 마스킹 처리) |
| GET | `/api/stocks/:code/stats` | 24h 감성 분포 + 전일 대비 글 증감률 |
| GET | `/api/stocks/:code/summary` | 종목 한줄평 (analyzer 가 생성한 프리셋) |

### 지표 — 시장 전체 (`index` 모듈, `MarketController`)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/market/summary` | 전체 시장 한줄평 (시계열 누적, 최신값) |
| GET | `/api/market/ant-index/history?period=...` | 시장 개미지표 시계열 |

## DB 스키마 (5개 테이블)

[src/database/schema.ts](src/database/schema.ts) 가 SoT. **DDL은 Drizzle 이 관리**하고
크롤러(Python/SQLAlchemy)는 reflection 으로 같은 테이블을 읽음.

| 테이블 | 쓰는 쪽 | 한 줄 설명 |
|--------|--------|----------|
| `stocks` | seed.py + analyzer | 종목 마스터 + 한줄평 (analyzer 가 UPDATE) |
| `stock_prices` | crawler | 5분마다 시세 INSERT (시계열) |
| `posts` | crawler INSERT + analyzer UPDATE | 글/댓글 본문 + 감성 라벨 |
| `news` | (미구현) | 종목 관련 뉴스 (스키마만 있고 코드 없음) |
| `market_summary` | analyzer | 시장 한줄평 INSERT (시계열 누적) |
| `index_snapshots` | analyzer | 종목별 SB/GAZUA 지수 시계열 |

자세한 정의는 [src/database/schema.ts](src/database/schema.ts) 참조.

## 마이그레이션 워크플로우

```bash
# 1. src/database/schema.ts 를 직접 수정
# 2. SQL 생성
make migrate-gen     # 또는: cd server && npx drizzle-kit generate
# 3. 생성된 SQL 확인 후 적용
make migrate         # 또는: cd server && npx drizzle-kit migrate
```

생성된 SQL 은 `server/drizzle/*.sql` 에 누적. **마이그레이션 파일은 절대 손으로 수정 금지**
— 항상 schema.ts 수정 → generate → migrate.

## 모듈 아키텍처

```
AppModule
├── DatabaseModule     # 전역 — Drizzle 인스턴스 Provider 제공
├── StocksModule       # /api/stocks — 종목 목록
└── IndexModule        # /api/stocks/:code/* + /api/market/* — 지표/통계/한줄평 전부
                       # (서비스 하나로 합쳐서 컨트롤러 두 개로 라우팅)
```

**NestJS 표준 3계층**:
- **Controller** = 라우팅 + DTO 변환 (Swagger 어노테이션도 여기)
- **Service** = 비즈니스 로직 + Drizzle 쿼리
- **DTO** = 응답 스키마 (Swagger 자동 문서화에 사용)

크롤러의 `main → jobs → scrapers/sentiment` 구조와 동일한 사상:
**얇은 라우터 + 두꺼운 서비스**.

## 코드 컨벤션

- **TypeScript strict** — `tsconfig.json` 에서 strict 모드 활성. `any` 회피.
- **Drizzle 쿼리는 service 안에서만** — controller 에서 Drizzle 직접 사용 금지.
- **DTO 는 Swagger 어노테이션 필수** — `@ApiProperty()` 로 필드 설명 작성해서 `/docs` 자동 문서화.
- **에러 처리** — NestJS 기본 `HttpException` 계열 사용. 404 는 `NotFoundException` 등.
- **모듈 단위 분리** — 새 도메인은 새 모듈로 (`xxx.module.ts` + `xxx.controller.ts` + `xxx.service.ts` + `dto/`).

## 트러블슈팅

- **`Cannot find module './schema'`** → `npm run build` 한 번 돌려서 `dist/` 생성. 또는 `npm run start:dev` 사용.
- **DB 연결 실패** → `docker compose up -d` 로 db 컨테이너 띄웠는지, `DATABASE_URL` 의 호스트·포트(`localhost:5433`) 확인.
- **마이그레이션 충돌** → `drizzle/meta/_journal.json` 확인. 절대 수동 편집하지 말고 schema.ts → generate 사이클로 복구.

## 관련 문서

- 상위 프로젝트 개요: [/CLAUDE.md](../CLAUDE.md)
- 설계 문서: [/docs/PLAN.md](../docs/PLAN.md)
- 크롤러 (데이터 공급원): [/crawler/README.md](../crawler/README.md)
- 프론트엔드 (API 소비자): [/web/README.md](../web/README.md)
