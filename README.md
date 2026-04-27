# 개미지표 (Ant-Index)

한국 주식 커뮤니티의 감성을 분석하여 시장 심리 지표를 산출하는 프로젝트.

네이버증권 종목토론실의 글을 크롤링하고, 로컬 LLM(Exaone 3.5)으로 감성분석하여 **ㅅㅂ지수**(공포/분노)와 **가즈아지수**(환희/탐욕)를 만든다.

<!-- TODO: 스크린샷 추가 -->

## 지표

| 지표 | 설명 | 범위 |
|------|------|------|
| **ㅅㅂ지수** | 하락론자(BEAR) 비율 기반. 높을수록 분노/공포 | 0~100 |
| **가즈아지수** | 상승론자(BULL) 비율 기반. 높을수록 환희/탐욕 | 0~100 |

- 좋아요 가중치: `1 + log10(좋아요 + 1)` — 공감받은 의견에 더 높은 비중
- AI 한줄평: 종목별 + 전체 시장 분위기 요약 (30분마다 갱신)
- 국내 인기 종목 30개 대상 (종토방 활동량 기준 선정)

## 아키텍처

```
[crawler 컨테이너] 30분 주기
  네이버증권 크롤링 → posts + stock_prices 저장

[analyzer 컨테이너] 30분 주기
  감성분석 → 스냅샷 저장 → 한줄평 생성

[NestJS 서버]
  DB 읽기 → 실시간 지표 계산 → REST API

[Next.js 대시보드]
  API → 게이지, 차트, 종목 테이블
```

## 기술 스택

| 영역 | 스택 |
|------|------|
| DB | PostgreSQL 16 (Docker) |
| 백엔드 | NestJS + Drizzle ORM |
| 크롤러 | Python + requests + BeautifulSoup |
| 감성분석 | Ollama + Exaone 3.5 2.4B (로컬, 비용 $0) |
| 프론트엔드 | Next.js + shadcn/ui + Tailwind CSS |
| 오케스트레이션 | Docker Compose |

## 프로젝트 구조

```
ant-index/
├── crawler/              # Python 크롤러 + 감성분석 + 한줄평
│   ├── crawler/
│   │   ├── sources/      # 네이버증권 크롤러
│   │   ├── sentiment/    # 감성분석 + 한줄평 생성
│   │   └── db.py         # SQLAlchemy (reflection)
│   ├── main.py           # 엔트리포인트
│   └── Dockerfile
├── server/               # NestJS 백엔드
│   ├── src/
│   │   ├── database/     # Drizzle 스키마 (6개 테이블)
│   │   ├── stocks/       # 종목 조회 + 시세
│   │   └── index/        # 지표 계산 + 히스토리
│   └── drizzle/          # 마이그레이션
├── web/                  # Next.js 대시보드
│   └── src/
│       ├── app/          # 메인 대시보드 + 종목 상세
│       ├── components/   # 게이지, 차트, 테이블
│       └── lib/          # API 래퍼 + React Query
├── docker-compose.yml
└── docs/
    ├── PLAN.md           # 설계 문서
    └── IMPLEMENT.md      # 데브로그
```

## 실행 방법

```bash
# 사전 요구: Docker, Ollama (exaone3.5:2.4b 모델)

# DB + 크롤러 + 분석기 실행
docker compose up -d

# NestJS 서버
cd server && npm install && npm run start:dev

# Next.js 대시보드
cd web && npm install && npm run dev
```

## 진행 상황

Phase 1 (MVP) 완료. 데이터 축적 중.

- [x] 네이버증권 크롤러 (종토방 + 시세 + 코스피)
- [x] Exaone 감성분석 파이프라인
- [x] ㅅㅂ지수 / 가즈아지수 실시간 계산
- [x] AI 한줄평 (종목별 + 시장 전체)
- [x] 스냅샷 저장 (index_snapshots)
- [x] REST API + Next.js 대시보드
- [x] Docker 컨테이너 자동 운영 (30분 주기)
- [ ] 30일 min/max 정규화
- [ ] 토스증권 크롤러
- [ ] 미국주식 (나스닥) 확장
- [ ] UI 고도화 + 온프레미스 배포

상세 데브로그: [docs/IMPLEMENT.md](docs/IMPLEMENT.md)
