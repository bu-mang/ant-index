# 프론트엔드 사양서

## 기술 스택

- Next.js (App Router) + React 19 + TypeScript strict
- Tailwind CSS v4 (CSS-first, `@theme inline`)
- shadcn/ui (base-nova style, Base UI primitives)
- TanStack React Query v5
- Recharts v3
- lucide-react (아이콘)
- next-themes (다크/라이트 테마)

## 디렉토리 구조

```
web/src/
├── app/                    # App Router 페이지
│   ├── layout.tsx          # 루트 레이아웃 (폰트, 메타데이터)
│   ├── page.tsx            # 메인 대시보드
│   ├── globals.css         # CSS 변수, 테마, 베이스 스타일
│   ├── providers.tsx       # ThemeProvider + QueryClientProvider
│   └── stocks/[code]/      # 종목 상세 페이지
├── components/
│   ├── ui/                 # shadcn/ui 기반 공용 컴포넌트 (Card, Button, Badge, Table)
│   └── *.tsx               # 비즈니스 컴포넌트 (GaugeChart, StockTable 등)
└── lib/
    ├── utils.ts            # cn() 유틸리티 (clsx + tailwind-merge)
    ├── api.ts              # API 클라이언트 + 타입 정의
    └── queries.ts          # React Query 훅 (useStocks, useSbHistory 등)
```

## 컴포넌트 컨벤션

### 파일 & 네이밍
- 파일명: **kebab-case** (`gauge-chart.tsx`, `stock-table.tsx`)
- 컴포넌트: **PascalCase** named export (`export function GaugeChart`)
- Props: **interface** 사용 (`interface GaugeChartProps`)

### 클래스 작성
- **`cn()`** 필수 사용 — 조건부 클래스, className 병합 시
- **`cva()`** — ui 컴포넌트의 variant 정의 시 (badge, button 등)
- **시맨틱 토큰 우선** — `bg-background`, `text-foreground`, `bg-sb` 등 CSS 변수 기반 클래스 사용
- **하드코딩 금지** — `bg-gray-400` 같은 명시적 컬러칩 사용 자제 (테마 전환 깨짐)
- 짧은 정적 클래스는 문자열 직접 사용 OK (`className="text-sm font-bold"`)

```tsx
// 조건부 클래스
<div className={cn("text-sm", isActive && "font-bold", className)} />

// cva variant
const badgeVariants = cva("rounded-full px-2 py-1 text-xs", {
  variants: {
    variant: { default: "bg-primary text-primary-foreground" },
  },
});
```

### import 순서
1. React / Next.js (`react`, `next/link`, `next/font`)
2. 외부 라이브러리 (`@tanstack/react-query`, `lucide-react`, `next-themes`)
3. 내부 ui 컴포넌트 (`@/components/ui/...`)
4. 내부 비즈니스 컴포넌트 (`@/components/...`)
5. lib 유틸리티 (`@/lib/...`)
6. 타입 (`import type { ... }`)

### 클라이언트 컴포넌트
- `"use client"` 디렉티브를 파일 최상단에 명시
- 서버 컴포넌트가 기본 — 상태/이벤트/브라우저 API 필요 시에만 클라이언트로

## 컬러 시스템

CSS 변수 기반, `:root`(라이트) / `.dark`(다크)로 분리. OKLCH 컬러 스페이스 사용.

### 시맨틱 토큰
| 토큰 | 용도 | Tailwind 클래스 |
|------|------|-----------------|
| `background` / `foreground` | 기본 배경/텍스트 | `bg-background`, `text-foreground` |
| `card` / `card-foreground` | 카드 배경/텍스트 | `bg-card`, `text-card-foreground` |
| `muted` / `muted-foreground` | 보조 배경/텍스트 | `bg-muted`, `text-muted-foreground` |
| `primary` / `primary-foreground` | 주요 액션 | `bg-primary`, `text-primary-foreground` |
| `accent` / `accent-foreground` | 오렌지 포인트 | `bg-accent`, `text-accent` |
| `sb` / `sb-foreground` | sbindex 레드 | `bg-sb`, `text-sb` |
| `gazua` / `gazua-foreground` | 가즈아 그린 | `bg-gazua`, `text-gazua` |
| `destructive` | 에러/경고 레드 | `bg-destructive` |
| `border` | 테두리 | `border-border` |

### 차트 컬러
- `chart-1`: sb 레드
- `chart-2`: gazua 그린
- `chart-3`: accent 오렌지
- `chart-4`, `chart-5`: 그레이 계열

## 데이터 페칭

### API 클라이언트 (`lib/api.ts`)
- `fetchApi<T>(path)` 제네릭 래퍼
- `api.getStocks()`, `api.getSbIndex(code)` 등 네임스페이스 패턴

### React Query 훅 (`lib/queries.ts`)
- `useStocks()`, `useSbHistory(code, period)` 등
- `staleTime: 60_000` (1분 캐시)
- 조건부 쿼리: `enabled: !!code`

## 레이아웃

- 최대 콘텐츠 폭: `max-w-432` (1728px)
- 헤더: fixed, 좌측 영역
- 우측 사이드바: fixed, 480px (`w-120`), 종목 테이블
- 본문: `pt-14 lg:mr-120`으로 헤더/사이드바 공간 확보
- `lg` 미만에서 사이드바 숨김

## 테마

- `next-themes` + `ThemeProvider` (attribute="class")
- 기본 테마: dark
- 토글: `ThemeToggle` 컴포넌트 (헤더 우측)
- CSS 변수가 `.dark` 클래스 유무에 따라 자동 전환
