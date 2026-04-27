# 개미지표 (Ant-Index) 구현 내역

## 프로젝트 개요

한국 주식 커뮤니티(종목토론실)의 글을 크롤링하고 감성 분석하여 시장 심리 지표를 만드는 프로젝트.

## 현재 구조

```
ant-index/
├── docker-compose.yml          # DB + crawler + analyzer 컨테이너
├── .env                        # DB 접속 정보 (포트 5433)
├── server/                     # NestJS 백엔드 (지표 계산 + REST API)
│   ├── src/
│   │   ├── database/
│   │   │   ├── schema.ts       # Drizzle ORM 스키마 (6개 테이블)
│   │   │   └── database.module.ts
│   │   ├── stocks/             # 종목 CRUD + 시세 조회
│   │   ├── index/              # 지표 계산 + 한줄평 + 히스토리
│   │   └── app.module.ts
│   └── drizzle/                # 마이그레이션 SQL (0000~0002)
├── crawler/                    # Python 크롤러 + 감성분석 + 한줄평
│   ├── Dockerfile
│   ├── main.py                 # 엔트리포인트 (loop-crawl / loop-analyze)
│   ├── crawler/
│   │   ├── db.py               # SQLAlchemy (reflection)
│   │   ├── config.py           # 환경변수
│   │   ├── sources/
│   │   │   └── naver.py        # 네이버증권 크롤러 (종토방 + 시세 + 코스피)
│   │   └── sentiment/
│   │       ├── analyzer.py     # Exaone 감성분석 (배치)
│   │       └── summarizer.py   # 한줄평 생성 + 스냅샷 저장
│   └── requirements.txt
└── web/                        # Next.js 프론트엔드 (대시보드)
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx        # 메인 대시보드
    │   │   └── stocks/[code]/  # 종목 상세
    │   ├── components/         # GaugeChart, TimeSeriesChart, StockTable 등
    │   └── lib/
    │       ├── api.ts          # API 래퍼 + 타입
    │       └── queries.ts      # TanStack Query hooks
    └── package.json
```

## 데브로그

### 2026-04-27 — 프로젝트 초기 구축

- Exaone 3.5 2.4B 감성분석 방식 선정 (테스트 정확도 9/10)
- 국내 인기 종목 30개 선정 (종토방 활동량 기준)
- PostgreSQL 16 Docker Compose 구성 (포트 5433)
- DB 스키마 정의 (Drizzle ORM): stocks, stock_prices, posts, news, index_snapshots
- 네이버증권 종목토론실 크롤러 구현 (crawl_board, crawl_post_detail)
- NestJS + DatabaseModule + Drizzle Provider 설정
- Drizzle 마이그레이션 실행, 종목 30개 시드 데이터 삽입
- 크롤링 → DB 저장 파이프라인 완성
- 감성분석 파이프라인 완성 (미분석 글 배치 처리)
- 지표 계산 로직 구현 (좋아요 가중 ㅅㅂ지수/가즈아지수)
- REST API 구현 (종목 목록, SB/GAZUA 현재값, 히스토리)
- Next.js 대시보드 MVP (게이지 차트, 시계열, 종목 테이블)
- 메인 대시보드 게이지를 삼성전자 단일 → 30종목 평균으로 변경

### 2026-04-27 — 크롤러 고도화 + Docker 컨테이너

- 크롤러 다중 페이지 (1페이지 → 5페이지, 종목당 ~100개)
- 30분 주기 루프 구현 (loop-crawl, loop-analyze)
- Docker 컨테이너 분리: crawler(크롤링), analyzer(분석+한줄평)
- 1년 TTL 클린업을 crawler 30분 루프에 통합 (24시간마다 1회)
- 네이버증권 시세 크롤링 추가 (crawl_price: 현재가 + 등락률)

### 2026-04-27 — 한줄평 기능

- 종목별 한줄평: analyzer가 감성분석 후 Ollama로 생성 → stocks.summary에 저장
- 전체 시장 한줄평: 30종목 평균 지수로 생성 → market_summary 테이블 (append-only)
- NestJS는 DB에서 읽기만 (서비스 간 통신 없음, fire-and-forget 구조)
- stocks 테이블에 summary, summary_updated_at 컬럼 추가
- market_summary 테이블 추가
- Drizzle 마이그레이션 (0001_white_proteus)
- 프론트: 종목 상세에 한줄평 카드, 메인에 전체 시장 한줄평 표시

### 2026-04-28 — 타임존 + 로그 + 한줄평 개선

- 전 테이블 timestamp → timestamptz 전환 (withTimezone: true)
- Python datetime.now() → datetime.now(timezone.utc)로 통일
- Drizzle 마이그레이션 (0002_slippery_prism)
- Dockerfile에 PYTHONUNBUFFERED=1 추가 (Docker 로그 정상 출력)
- 한줄평 프롬프트 개선: 코스피 지수 크롤링(crawl_kospi), 30종목 시세 통계 반영
- 프롬프트 말투를 캐주얼/감성적으로 변경 (뉴스체 금지, 반말, 20~35자 권장)
- temperature 0.7 → 0.5로 조정

### 2026-04-28 — 스냅샷 + 시세 UI

- index_snapshots 저장 로직 추가 (analyzer 사이클마다 종목별 SB/GAZUA 스냅샷)
- 종목 테이블에 현재가/등락률 컬럼 추가
- 종목 상세 페이지에 가격/등락률 표시
- 히스토리 date_trunc에 KST(Asia/Seoul) 보정 적용

## 현재 상태 요약

| 항목 | 상태 |
|------|------|
| DB 스키마 (6개 테이블) | ✅ 완료 |
| 종목 30개 시드 데이터 | ✅ 완료 |
| 네이버 종토방 크롤러 | ✅ 완료 (5페이지/종목) |
| 네이버 시세 크롤러 | ✅ 완료 |
| 코스피 지수 크롤러 | ✅ 완료 |
| 감성분석 파이프라인 | ✅ 완료 |
| 지표 계산 (SB/GAZUA) | ✅ 완료 (실시간 집계) |
| 한줄평 (종목별 + 시장) | ✅ 완료 |
| 스냅샷 저장 | ✅ 완료 |
| REST API | ✅ 완료 |
| Next.js 대시보드 | ✅ 완료 (MVP) |
| Docker 컨테이너 (3개) | ✅ 운영 중 |
| timestamptz 전환 | ✅ 완료 |
| 토스증권 크롤러 | ❌ 미착수 |
| 30일 min/max 정규화 | ❌ 미착수 (데이터 축적 필요) |
| 미국주식 (나스닥) | ❌ 미착수 |
| UI 고도화 | 🔄 진행 중 |

## 미완료 / 향후 작업

- 종목 테이블에 3일치 ㅅㅂ지수 뱃지 표시 (스냅샷 데이터 축적 후)
- 30일 min/max 정규화 (데이터 30일 축적 후 적용)
- 감성분석 프롬프트에 실제 주가 반영 (현재 price=0으로 대체 중)
- 토스증권 크롤러 (Playwright)
- 미국주식 나스닥 종목 추가
- UI 고도화 (정렬, 필터, 반응형, 다크/라이트 테마)
- OG 이미지 동적 생성
- 온프레미스 배포 (미니PC or 라즈베리파이)
