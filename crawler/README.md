# Ant-Index Crawler

한국 주식 커뮤니티(네이버 종토방·시세)에서 글을 수집해 Gemini LLM 으로 감성을
분류하고, ㅅㅂ/가즈아 지수와 한줄평을 PostgreSQL 에 누적하는 **배치 크롤러 서비스**.

- 외부에서 HTTP 요청을 받지 않는 **순수 배치/cron 앱** (FastAPI 등 웹 프레임워크 없음).
- 같은 PostgreSQL 을 공유하는 [NestJS 서버](../server)가 따로 HTTP API 를 제공한다.
- docker-compose 에서 **crawler / analyzer 두 컨테이너**로 분리 실행. 같은 이미지를 공유하고
  CLI 명령만 다르다 (관심사 분리 + 격리).

## Quick Start

루트 `Makefile` 이 자주 쓰는 명령을 다 묶어둔다 (`make help` 로 목록 확인).

```bash
# 의존성 설치 (세 서비스 일괄: make install / crawler 만: make install-crawler)
make install-crawler

# 종목 30개 마스터 데이터 1회 시드
make seed

# 1회씩 실행
make crawl       # 글 크롤링 1회
make analyze     # 감성분석 + 한줄평 1회
make price       # 시세 크롤링 1회

# 무한 반복 (운영용)
make loop        # 크롤링+분석(30분) + 시세(5분) 동시

# 도커로 띄우기 (배포 형태)
make up          # docker compose up -d
make logs        # 실시간 로그
```

또는 직접:
```bash
cd crawler && pip install -r requirements.txt && python main.py --help
```

## 환경변수

`crawler/.env` 에 작성 (gitignore 됨). 필수는 두 개:

```env
DATABASE_URL=postgresql://antindex:antindex2026@localhost:5433/antindex
GEMINI_API_KEY=AIza...   # https://aistudio.google.com/apikey 에서 발급 (무료 티어)
```

선택:
```env
SENTIMENT_PROVIDER=gemini      # 또는 ollama (로컬 폴백)
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_RPM=15                  # 무료 티어 분당 요청 제한
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=exaone3.5:2.4b
```

## 디렉토리 구조

```
crawler/
├── main.py                    # 🚀 typer 기반 CLI 디스패처 (얇음, 비즈니스 로직 0)
├── seed.py                    # 🌱 stocks 마스터 30종목 1회 시드
├── Dockerfile                 # python:3.12-slim, requirements.txt 기반 빌드
├── requirements.txt           # 의존성 (typer, sqlalchemy, requests, bs4 등)
├── pyproject.toml             # PEP 621 메타데이터 + setuptools 빌드 설정
├── .env                       # 환경변수 (gitignore)
│
├── antindex/                  # 🐜 Python 패키지 (실제 코드)
│   ├── config.py              # 환경변수 단일 통로
│   ├── db.py                  # SQLAlchemy + DB 헬퍼 (모든 SQL 여기 집중)
│   ├── logging_config.py      # 로깅 초기화 (엔트리포인트에서 setup_logging() 호출)
│   │
│   ├── jobs/                  # ⭐ 작업 단위 — "한 작업의 시작부터 끝까지"
│   │   ├── crawl.py           #   글 수집 + 24h 자동 cleanup
│   │   ├── analyze.py         #   감성분석 + 한줄평 + 스냅샷
│   │   ├── price.py           #   시세 수집
│   │   └── loop.py            #   주기 반복 유틸 (예외 발생해도 다음 사이클로)
│   │
│   ├── scrapers/              # 🌐 외부 데이터 수집 어댑터
│   │   └── naver.py           #   네이버증권 종토방 + 시세 크롤링
│   │
│   └── sentiment/             # 🧠 감성분석 + 지표 산출 도메인 (이 앱의 두뇌)
│       ├── llm.py             #   LLM 호출 추상화 (Gemini ↔ Ollama, RPM throttle, 재시도)
│       ├── analyzer.py        #   글 → BULL/BEAR/NEUTRAL 분류 (프롬프트 + 배치)
│       └── summarizer.py      #   라벨 → ㅅㅂ/가즈아 지수 → 5×5 프리셋 매핑 (LLM 호출 0)
│
└── tests/
    └── test_sentiment.py      # 감성분석 정확도 회귀 테스트 (10개 샘플)
```

## CLI 명령 — main.py

`typer` 기반. **main.py 는 라우터 역할만**, 실제 일은 `antindex.jobs.*` 가 한다.

| 명령 | 설명 | docker 서비스 |
|------|------|------------|
| `once` (기본) | 글 크롤링 + 감성분석 1회씩 | (수동 실행용) |
| `crawl` | 글 크롤링만 1회 | — |
| `price` | 시세만 1회 | — |
| `analyze` | 감성분석 + 한줄평 1회 | — |
| `clean` | 1년 지난 글 삭제 1회 | — |
| `loop` | 크롤링+분석(30분) + 시세(5분) 동시 반복 | (개발용 통합) |
| `loop-crawl-price` | 글(30분) + 시세(5분) 동시 | **crawler** 컨테이너 |
| `loop-analyze` | 분석만 30분 주기 반복 | **analyzer** 컨테이너 |
| `loop-crawl` | 크롤링만 30분 주기 반복 | — |
| `loop-price` | 시세만 5분 주기 반복 | — |

`python main.py --help` 로 typer 가 자동 생성한 도움말 확인.

## 데이터 흐름

```
                  [ 외부 세계 ]
                       │
              네이버 종토방 / Gemini API
                       │
                       ▼
  scrapers/naver  ←─  외부 수집 어댑터
  sentiment/llm   ←─  외부 LLM 어댑터
                       ▲
                       │
  sentiment/{analyzer, summarizer}
       (도메인 로직: 프롬프트, 가중치, 프리셋)
                       ▲
                       │
  jobs/{crawl, analyze, price, loop}
       (작업 단위: 여러 모듈을 조립)
                       ▲
                       │
  main.py  ← typer CLI (얇은 디스패처)


★ 루트 인프라(config, db, logging_config) 는 어디서나 import 가능
   — 양방향 의존을 만들지 않도록 leaf 위치 유지
```

**원칙**: 위에서 아래로만 의존. 역방향 import 는 만들지 않는다
(`scrapers/naver.py` 가 `jobs/` 나 `main.py` 를 import 하면 안 됨).

## 코드 컨벤션

- **타입 힌트** — 공개 함수 시그니처에 입력/반환 타입 명시 (Pylance 자동완성·타입체크 효과)
- **로깅** — `print()` 금지, `log = logging.getLogger(__name__)` 사용. 포맷팅은 `%` 스타일
  (lazy formatting — 레벨 비활성 시 비용 0).
  ```python
  log.info("[%s] %d개 새 글 저장", stock_name, count)   # ✅
  log.info(f"[{stock_name}] {count}개 새 글 저장")       # ❌ (lazy 안 됨)
  ```
- **DB 접근** — 반드시 `antindex.db` 헬퍼 함수만 호출. `engine.connect()` 를 다른
  모듈이 직접 쓰지 않는다.
- **환경변수** — `antindex.config` 한 곳에서만 `os.getenv`. 다른 모듈은 거기서 import.
- **with 블록** — DB 커넥션·외부 자원은 항상 `with ... as ...:` 로 감싸 누수 방지.

## 새 모듈 추가할 때

| 어떤 코드인가 | 어디에 두나 |
|-------------|-----------|
| 새 외부 데이터 소스 (사이트, API 크롤링) | `antindex/scrapers/<source>.py` |
| 새 작업 명령 (예: 일주일치 백필) | `antindex/jobs/<job>.py` + `main.py` 에 typer 명령 추가 |
| 새 분석 기법 (토픽 모델링, 키워드 추출 등) | `antindex/sentiment/<feature>.py` 또는 새 폴더 |
| 새 DB 헬퍼 함수 | `antindex/db.py` 의 적절한 섹션 (공용/크롤러용/분석기용) |
| 새 환경변수 | `antindex/config.py` 에 상수 추가 |

## 트러블슈팅

- **`GEMINI_API_KEY가 설정되지 않았습니다`** → `crawler/.env` 에 키 채워넣기 + 재시작.
- **컨테이너에서 분석 실패** → `docker compose config` 로 analyzer 서비스에 `GEMINI_API_KEY`
  가 전달되는지 확인. `docker-compose.yml` 의 `env_file: ./crawler/.env` 로 처리됨.
- **무료 한도 초과** → `GEMINI_RPM` 낮추거나 배치 크기 늘리거나, `SENTIMENT_PROVIDER=ollama`
  로 로컬 폴백 (Ollama + `exaone3.5:2.4b` 필요).
- **PostgreSQL 연결 실패** → `make up` 으로 db 컨테이너 먼저 실행. 포트는 호스트 `5433`,
  컨테이너 내부 `5432`.

## 관련 문서

- 상위 프로젝트 개요: [/CLAUDE.md](../CLAUDE.md)
- 설계 문서: [/docs/PLAN.md](../docs/PLAN.md)
- 구현 내역: [/docs/IMPLEMENT.md](../docs/IMPLEMENT.md)
- DB 스키마(Drizzle SoT): [/server/src/database/schema.ts](../server/src/database/schema.ts)
- HTTP API 서버: [/server/README.md](../server/README.md)
