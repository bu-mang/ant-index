# `antindex` 패키지

개미지표 크롤러의 Python 패키지. 이 디렉토리 트리만 보면 코드 구조와 책임 분리를
한눈에 파악할 수 있도록 정리되어 있다.

엔트리포인트는 `crawler/main.py` (typer CLI) 와 `crawler/seed.py` (1회성 시드)
이며, 두 파일 모두 여기 `antindex.*` 모듈을 import 해서 동작한다.

## 디렉토리 한눈에

```
antindex/
├── config.py              # 환경변수 / 설정 (인프라)
├── db.py                  # SQLAlchemy + DB 접근 헬퍼 (인프라)
├── logging_config.py      # 로깅 초기화 (인프라)
│
├── jobs/                  # ⭐ 작업 단위 — "무엇을 할까"
├── scrapers/              # 🌐 외부 수집 — "어디서 가져올까"
└── sentiment/             # 🧠 감성분석 도메인 — "어떻게 분석할까"
```

루트의 세 파일(`config.py`, `db.py`, `logging_config.py`)은 어디서나 import 되는
공용 인프라다. 별도 폴더로 빼기엔 너무 작고 응집도가 약해서 패키지 루트에 둔다.

## 루트 인프라 모듈

### `config.py`
환경변수 단일 통로. `python-dotenv` 로 `.env` 를 로딩하고 상수로 노출한다.

- `DATABASE_URL` — Postgres 접속 문자열
- `SENTIMENT_PROVIDER` — `"gemini"` (기본) 또는 `"ollama"`
- `GEMINI_API_KEY` / `GEMINI_MODEL` / `GEMINI_RPM` — Gemini API 설정
- `OLLAMA_URL` / `OLLAMA_MODEL` — 로컬 폴백용

새 환경변수는 반드시 여기에 먼저 추가하고 다른 모듈은 `from antindex.config import X` 로
받아 쓴다. `os.getenv` 산발 금지.

### `db.py`
SQLAlchemy 엔진 + 테이블 reflection + DB 접근 헬퍼 함수들. **모든 SQL 은 여기에 있고**
다른 모듈은 헬퍼만 호출한다 (`from antindex.db import insert_post, get_sentiment_weights, ...`).

함수는 호출자 그룹별로 정렬되어 있다:
1. **공용**: `get_active_stocks`
2. **크롤러용**: `insert_post`, `insert_price`, `delete_old_posts`
3. **분석기용**: `get_unanalyzed_posts`, `update_sentiment`, `get_sentiment_weights`,
   `insert_snapshot`, `update_summary`, `insert_market_summary`

이 분류는 docker-compose 의 `crawler` / `analyzer` 서비스 분리와 1:1 대응된다.

### `logging_config.py`
중앙 로깅 설정. **엔트리포인트(`main.py` / `seed.py` / 테스트) 에서만**
`setup_logging()` 을 1회 호출한다. 라이브러리 모듈들은 `logging.getLogger(__name__)`
만 쓰고 설정은 절대 건드리지 않는다.

포맷: `2026-05-13 12:34:56 [INFO] antindex.scrapers.naver: 삼성전자 종토방 크롤링 중...`

## `jobs/` — 작업 단위 오케스트레이션

`main.py` 의 typer 명령들이 호출하는 "한 작업의 시작부터 끝까지"를 정의한다.
여러 모듈(`scrapers`, `sentiment`, `db`)을 조립해서 사이클을 완성한다.

| 파일 | 핵심 함수 | 하는 일 |
|------|----------|--------|
| `crawl.py` | `crawl_all()`, `clean()` | 30종목 종토방 글 수집 + 24시간마다 자동 cleanup |
| `analyze.py` | `analyze_all()`, `generate_summaries()` | 미분석 글 → Gemini 분류 → 한줄평·스냅샷 |
| `price.py` | `price_all()` | 30종목 시세 1회 수집 |
| `loop.py` | `run_loop(task, interval)` | 임의의 task 를 주기적으로 반복 (예외 발생해도 다음 사이클로) |

**규칙**: jobs 는 다른 jobs 를 import 하지 않는다. 조합은 `main.py` 의 typer 명령
정의 단계에서만 한다 (예: `loop` 명령이 `crawl_all + analyze_all` 을 묶음).

## `scrapers/` — 외부 데이터 수집 어댑터

웹사이트나 외부 API 와의 경계. HTML 파싱·HTTP 요청·User-Agent 회피처럼 "더러운 일"을
이 폴더에 격리해서, 사이트 구조가 바뀌어도 영향이 한 파일에 머무르게 한다.

| 파일 | 다루는 소스 | 핵심 함수 |
|------|-----------|---------|
| `naver.py` | 네이버 증권 | `crawl_board`, `crawl_post_detail`, `crawl_price`, `crawl_kospi` |

**확장 패턴**: 토스/카카오스탁/한투 API 등이 추가되면 `scrapers/toss.py`, `scrapers/kis.py`
식으로 형제 모듈로 늘어난다. jobs 는 어떤 scraper 인지 몰라도 동작하도록 인터페이스만 맞춘다.

## `sentiment/` — 감성분석 + 지표 산출 도메인

이 프로젝트의 "두뇌" — 다른 폴더는 도구/배관이라면 여기는 핵심 비즈니스 가치.

| 파일 | 역할 | 외부 의존 |
|------|------|---------|
| `llm.py` | LLM 호출 추상화 (Gemini ↔ Ollama 전환) — `complete_json(prompt)` 한 함수로 단일화. RPM throttle + 429/5xx 재시도 내장 | Gemini API 또는 로컬 Ollama |
| `analyzer.py` | 글 본문 → BULL/BEAR/NEUTRAL 분류. 프롬프트 + few-shot 예시 + 배치 호출 | `llm.py` |
| `summarizer.py` | 분류 라벨 → ㅅㅂ/가즈아 지수 → 5×5 프리셋 매핑 (LLM 호출 0회) | `db.get_sentiment_weights` |

**중요**: `summarizer.py` 는 LLM 을 일절 쓰지 않는다. 한줄평은 모두
`PRESETS[sb_tier][gazua_tier]` 미리 정의된 25개 문구에서 선택한다. (무료 티어
RPD 예산 보호 목적)

## 의존성 흐름 — 한 방향만

```
                  [ 외부 세계 ]
                       │
              네이버 / Gemini API
                       │
                       ▼
  scrapers/*  ←─  외부 수집 어댑터
  sentiment/llm  ← 외부 LLM 어댑터
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

**원칙**: 위에서 아래로만 의존. 거꾸로 가는 import 는 만들지 않는다
(`scrapers/naver.py` 가 `jobs/` 나 `main.py` 를 import 하면 안 됨).

이 방향성을 지키면:
- 아래 계층을 단독 테스트 가능
- 위 계층 바꿔도 아래는 영향 없음
- import 순환 자동 회피

## 코드 컨벤션

- **타입 힌트** — 공개 함수 시그니처에 입력/반환 타입 명시 (Pylance 자동완성 + IDE 효과)
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
| 새 외부 데이터 소스 (사이트, API 크롤링) | `scrapers/<source>.py` |
| 새 작업 명령 (예: 일주일치 백필) | `jobs/<job>.py` + `main.py` 에 typer 명령 추가 |
| 새 분석 기법 (토픽 모델링, 키워드 추출 등) | `sentiment/<feature>.py` 또는 `nlp/` 등 새 폴더 |
| 새 DB 헬퍼 함수 | `db.py` 의 적절한 섹션 (공용/크롤러용/분석기용) |
| 새 환경변수 | `config.py` 에 상수 추가 + `.env.example` 갱신 |
