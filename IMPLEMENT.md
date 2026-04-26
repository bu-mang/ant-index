# 개미지표 (Ant-Index) 구현 내역

## 프로젝트 개요

한국 주식 커뮤니티(종목토론실)의 글을 크롤링하고 감성 분석하여 시장 심리 지표를 만드는 프로젝트.

## 현재 구조

```
ant-index/
├── docker-compose.yml          # PostgreSQL 16 컨테이너
├── .env                        # DB 접속 정보 (포트 5433)
├── server/                     # Nest.js 백엔드
│   ├── src/
│   │   ├── database/
│   │   │   └── schema.ts       # Drizzle ORM 스키마 (5개 테이블)
│   │   ├── app.module.ts       # Nest.js 앱 모듈 (DB 미연결)
│   │   └── ...
│   ├── drizzle/
│   │   └── 0000_init.sql       # 생성된 마이그레이션 SQL
│   └── drizzle.config.ts       # Drizzle 설정
├── crawler/                    # Python 크롤러
│   ├── db.py                   # SQLAlchemy 설정 (reflection 방식)
│   ├── main.py                 # 엔트리포인트 (DB 연결 테스트)
│   ├── sources/
│   │   └── naver.py            # 네이버증권 종목토론실 크롤러
│   ├── test_sentiment.py       # 감성 분석 테스트 코드
│   └── sentiment/
│       └── dictionaries/       # (비어있음, 미사용)
└── PLAN.md                     # 전체 설계 문서
```

## 완료된 작업

### 1. 감성 분석 방식 선정

HuggingFace 분류 모델 3종 테스트 후 정확도 부족으로 탈락. 로컬 LLM 방식으로 전환.

- 최종 선택: **Ollama + Exaone 3.5 2.4B**
- 배치 프롬프트로 여러 글을 한 번에 분석
- temperature 0.5, JSON 응답 형식 강제
- 테스트 정확도: 8~9/10
- 프롬프트에 톤 판단 규칙, 비꼬기/풍자 감지, 현재 주가 컨텍스트 포함

테스트 코드: `crawler/test_sentiment.py`

### 2. 종목 선정

국내 인기 종목 30개 선정 완료 (종토방 활동량 기준). 종목코드 포함하여 PLAN.md에 기록.

### 3. 인프라

- **PostgreSQL**: Docker Compose로 구성. 포트 5433 (다른 프로젝트와 충돌 방지)
- **Ollama**: 시스템에 설치 완료. Exaone 3.5 2.4B 모델 다운로드 완료
- **.env**: 루트, server, crawler 3곳 동기화 완료

### 4. DB 스키마 (Drizzle ORM)

`server/src/database/schema.ts`에 5개 테이블 정의:

| 테이블 | 용도 |
|--------|------|
| stocks | 종목 마스터 (코드, 이름, 시장, 섹터) |
| stock_prices | 종목 시세 (현재가, 등락률, 시총 등) |
| posts | 크롤링한 글 (제목, 내용, 조회/추천/비추천) |
| news | 뉴스 링크 |
| index_snapshots | 지표 스냅샷 (시간별/일별) |

마이그레이션 SQL 생성 완료 (`server/drizzle/0000_init.sql`), 아직 DB에 미적용.

### 5. 네이버증권 크롤러

`crawler/sources/naver.py`에 두 함수 구현:

- `crawl_board(stock_code, page)`: 종목토론실 글 목록 크롤링 (1페이지 = ~20개 글)
- `crawl_post_detail(stock_code, nid)`: 개별 글 본문 크롤링 (Next.js SSR 데이터 파싱)
- User-Agent 로테이션 적용

### 6. Python 크롤러 DB 연결

`crawler/db.py`에 SQLAlchemy 설정. reflection 방식으로 Drizzle이 생성한 테이블을 자동으로 읽어옴. (DB에 테이블이 존재해야 동작)

## 미완료 작업

### 다음 단계: DB 셋업 → 크롤링 파이프라인

1. **Drizzle 마이그레이션 실행** — DB에 테이블 생성
2. **posts 테이블 스키마 수정** — profanityScore/euphoriaScore를 LLM 감성분석 결과 컬럼으로 교체 (sentimentLabel, sentimentReason 등)
3. **종목 30개 시드 데이터 삽입**
4. **크롤링 파이프라인** — 30개 종목 순회하며 크롤링 → DB 저장
5. **감성 분석 파이프라인** — 미분석 글 조회 → Exaone 배치 분석 → DB 업데이트
6. **LLM 실패 시 재요청 로직 (fallback)**
7. **지표 계산** — 상승론자/하락론자 비율로 ㅅㅂ지수/가즈아지수 산출
8. **웹앱 (Next.js)** — 대시보드, 게이지 차트, 종목별 상세

### 정리 필요

- `crawler/requirements.txt`에 미사용 의존성 남아있음 (fake-useragent, torch, transformers, playwright, pykrx)
- `crawler/sentiment/dictionaries/` 비어있음 (LLM 방식으로 전환하여 불필요)
- 루트와 crawler에 venv가 각각 존재 — 통합 필요
