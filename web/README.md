# Ant-Index Web

NestJS 서버([../server](../server))의 REST API 를 호출해 ㅅㅂ/가즈아지수, 시계열 차트,
종목별 한줄평 등을 시각화하는 **Next.js 대시보드**.

- **Next.js 16** + **React 19** + **TailwindCSS 4** + **shadcn/ui (Base UI 기반)**
- **TanStack Query v5** 로 API 호출/캐싱 (5분 stale time)
- **Recharts 3** 로 시계열·게이지 차트
- **GSAP** 로 헤더 frosted glass·헤로 애니메이션
- 다크모드 (`next-themes`), Zod 스키마 검증

> ⚠️ **이 프로젝트의 Next.js / React 는 LLM 학습 데이터보다 신버전이다.**
> Next.js 16 + React 19 + Tailwind 4 모두 이전 메이저 대비 **breaking change** 가 있다.
> 새 코드를 짤 때는 추측하지 말고 `node_modules/next/dist/docs/` 의 가이드와 deprecation
> 경고를 먼저 읽을 것. 자세한 주의사항은 [AGENTS.md](AGENTS.md).

## Quick Start

```bash
# 의존성 설치 (세 서비스 일괄: make install / web 만: make install-web)
make install-web

# 개발 서버 (포트 3030)
make web         # 또는: cd web && npm run dev

# 프로덕션 빌드 + 실행
cd web && npm run build && npm start

# Lint
cd web && npm run lint
```

기본 포트 **3030** ([http://localhost:3030](http://localhost:3030)) — 백엔드(3000)와 분리.

## 환경변수

`web/.env.local` 에 작성 (gitignore 됨):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

배포 환경에서는 실제 서버 도메인으로 교체.

## 디렉토리 구조

```
web/
├── src/
│   ├── app/                            # 🚀 Next.js App Router
│   │   ├── layout.tsx                  #   루트 레이아웃 (테마, 폰트, providers)
│   │   ├── providers.tsx               #   TanStack Query / next-themes Provider 트리
│   │   ├── globals.css                 #   Tailwind 4 globals + 폰트 선언
│   │   ├── page.tsx                    #   메인 대시보드 (시장 + 종목 표)
│   │   └── stocks/[code]/page.tsx      #   종목 상세 페이지
│   │
│   ├── components/
│   │   ├── layout/                     # 🧱 페이지 골격 (전 페이지 공통)
│   │   │   ├── app-shell.tsx           #   최상위 셸 (좌측 sidebar + 우측 main)
│   │   │   ├── header.tsx              #   상단 헤더 (스크롤 시 frosted glass)
│   │   │   ├── footer.tsx
│   │   │   ├── sidebar.tsx             #   좌측 종목 리스트
│   │   │   └── main-content.tsx
│   │   │
│   │   ├── charts/                     # 📊 데이터 시각화
│   │   │   ├── gauge-chart.tsx         #   원형 게이지 (ㅅㅂ/가즈아 현재값)
│   │   │   ├── time-series-chart.tsx   #   시계열 라인 차트 (7d/30d/90d)
│   │   │   ├── unified-line-chart.tsx  #   통합 개미지표 라인
│   │   │   ├── dual-bar-chart.tsx      #   상승/하락 분포
│   │   │   ├── period-selector.tsx     #   7d/30d/90d 탭
│   │   │   └── date-tick.tsx           #   x축 날짜 포맷 헬퍼
│   │   │
│   │   ├── ui/                         # 🎨 shadcn/ui 프리미티브 (Base UI 기반)
│   │   │   ├── button.tsx, card.tsx, badge.tsx
│   │   │   ├── table.tsx, tabs.tsx, tooltip.tsx
│   │   │   └── chart.tsx               #   Recharts 래퍼
│   │   │
│   │   ├── icons/                      # 🎨 프로젝트 전용 SVG 아이콘
│   │   │   ├── pixel-ant.tsx           #   픽셀 개미 (브랜드 마스코트)
│   │   │   ├── taeguk.tsx              #   태극 (KOSPI 표시)
│   │   │   └── us-flag.tsx             #   미국 국기 (NASDAQ 표시 예정)
│   │   │
│   │   ├── brand/
│   │   │   └── ant-hero.tsx            #   메인 페이지 히어로 (GSAP 애니메이션)
│   │   │
│   │   ├── stock-table.tsx             #   종목 리스트 테이블 (sortable)
│   │   ├── theme-toggle.tsx            #   다크/라이트 모드 스위치
│   │   └── walking-ant.tsx             #   장식용 걷는 개미
│   │
│   ├── lib/                            # 🛠️  도메인 logic-less 유틸
│   │   ├── api.ts                      #   API 클라이언트 (fetch 래핑) — 서버 endpoint 1:1 매핑
│   │   ├── queries.ts                  #   TanStack Query 훅 (useStocks, useAntIndex 등)
│   │   ├── constants.ts                #   색상, 임계값, 라벨 매핑
│   │   └── utils.ts                    #   cn() 등 헬퍼
│   │
│   └── hooks/
│       └── use-mounted.ts              #   SSR hydration 안전장치 (mounted flag)
│
├── components.json                     # shadcn CLI 설정 (Base UI 변형)
├── next.config.ts
├── tailwind.config.* + postcss.config  # Tailwind 4 (PostCSS plugin 방식)
├── tsconfig.json
└── AGENTS.md                           # ⚠️ AI 어시스턴트 작업 시 주의사항
```

## 데이터 흐름

```
┌────────────────────────────────────────────────────────────┐
│  React 컴포넌트 (page.tsx, charts/*)                       │
│    │                                                       │
│    └─► useStocks(), useAntIndex(code), useSummary(code) ...│
│              │ (TanStack Query)                            │
│              └─► api.getStocks(), api.getAntIndex(code)... │
│                       │ (fetch)                            │
│                       └─► /api/* (NestJS 서버, 포트 3000)  │
│                              │                             │
│                              └─► PostgreSQL                │
└────────────────────────────────────────────────────────────┘
```

**얇은 라우터 + 두꺼운 서비스** 패턴이 프론트에도 적용됨:
- **컴포넌트** = UI 렌더 + props 받기 (로직 0)
- **`lib/queries.ts` 훅** = 캐시 키·stale time·activation 조건 관리
- **`lib/api.ts`** = fetch + 에러 처리 + 타입 캐스팅

## 주요 라이브러리 한 줄 설명

| 라이브러리 | 용도 |
|----------|------|
| `next` 16.2.4 | App Router, RSC, Server Actions (이전 메이저 대비 변경 큼) |
| `react` 19 | 신규 hooks, use(), Suspense 개선 |
| `tailwindcss` 4 | **PostCSS 플러그인 방식** (v3 와 설정 방식 다름) |
| `@base-ui/react` | shadcn 4 의 새 베이스 — Radix 후속 |
| `@tanstack/react-query` 5 | 서버 상태 캐싱·재검증 |
| `recharts` 3 | 차트 (게이지·라인·바) |
| `gsap` + `@gsap/react` | 헤더 frosted glass, 헤로 인트로 |
| `next-themes` | 다크모드 토글 |
| `zod` | API 응답 스키마 검증 (선택적) |
| `lucide-react` | 아이콘 (브랜드 SVG 외 일반 UI 아이콘) |

## 코드 컨벤션

상세 가이드는 `.claude/agents/frontend.md` 참조. 핵심만:

- **컬러 시스템** — Tailwind 토큰 사용 (`text-foreground`, `bg-card` 등). **하드코딩된 hex 금지**.
- **클라이언트 컴포넌트** — TanStack Query 사용 컴포넌트는 `"use client"` 필수 (RSC 안에서 못 씀).
- **데이터 fetching** — 페이지에서 직접 fetch 금지. 반드시 `lib/queries.ts` 의 훅을 통해.
- **shadcn 변형** — `components/ui/*.tsx` 는 shadcn CLI 로 추가 후 손으로 수정 가능. 컬러는
  토큰화된 형태로만 변경.
- **차트** — 모든 차트는 `components/charts/` 에 모임. 같은 종류는 재사용 (예: `time-series-chart`
  는 SB/GAZUA/통합지표 모두에 사용).
- **JSX 안 IIFE 금지** — `(() => { ... })()` 같은 즉시실행함수 패턴 사용하지 말 것.
  분기 로직은 컴포넌트 외부 함수로 분리.
- **날짜 처리** — `lib/utils.ts` 의 날짜 헬퍼만 사용 (`date-fns` 등 별도 라이브러리 추가 금지).

## 새 모듈 추가할 때

| 어떤 코드인가 | 어디에 두나 |
|-------------|-----------|
| 새 차트 종류 | `components/charts/<chart>.tsx` |
| 새 페이지 | `app/<route>/page.tsx` (App Router 컨벤션) |
| 새 API 엔드포인트 호출 | `lib/api.ts` 에 함수 추가 + `lib/queries.ts` 에 훅 추가 |
| 새 shadcn 컴포넌트 | `npx shadcn@latest add <name>` 로 추가 |
| 프로젝트 전용 SVG 아이콘 | `components/icons/<name>.tsx` |
| 페이지 전반 레이아웃 변경 | `components/layout/` |

## 트러블슈팅

- **API 호출 실패** → `NEXT_PUBLIC_API_BASE_URL` 확인 + NestJS 서버(`make server`) 실행 여부 확인.
- **Tailwind 클래스 적용 안 됨** — Tailwind 4 는 PostCSS 플러그인 방식이라 `postcss.config.mjs` 수정 후
  dev 서버 재시작 필요.
- **Hydration mismatch** — 클라이언트 전용 상태(다크모드 등) 는 `use-mounted.ts` 훅으로 가드.
- **Old Next.js 가이드 적용 안 됨** — 16 + React 19 는 RSC/Server Action 방식이 많이 바뀜.
  `AGENTS.md` 의 경고대로 추측 금지, 공식 가이드 참조.

## 관련 문서

- 상위 프로젝트 개요: [/CLAUDE.md](../CLAUDE.md)
- 설계 문서 (UI 와이어프레임 포함): [/docs/PLAN.md](../docs/PLAN.md)
- 백엔드 API 명세: [/server/README.md](../server/README.md) + Swagger `/docs`
- 데이터 공급 크롤러: [/crawler/README.md](../crawler/README.md)
- AI 어시스턴트 작업 가이드: [AGENTS.md](AGENTS.md)
