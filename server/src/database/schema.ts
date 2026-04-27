import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  bigint,
  decimal,
  boolean,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ─── Enums ───
export const marketEnum = pgEnum('market', [
  'KOSPI',
  'KOSDAQ',
  'NASDAQ',
  'NYSE',
]);
export const sourceEnum = pgEnum('source', ['NAVER', 'TOSS']); // 크롤링 출처
export const postTypeEnum = pgEnum('post_type', ['POST', 'COMMENT']); // 글 / 댓글
export const sentimentEnum = pgEnum('sentiment', ['BULL', 'BEAR', 'NEUTRAL']); // LLM 감성분석 결과
export const indexTypeEnum = pgEnum('index_type', [
  'SB', // 쏠림/버블 지수
  'GAZUA', // 가즈아 지수
  'FEAR_GREED', // 공포·탐욕 지수
]);
export const periodTypeEnum = pgEnum('period_type', ['HOURLY', 'DAILY']); // 지표 집계 주기

// ─── stocks (종목 마스터) ───
// 모든 테이블의 기준이 되는 종목 정보. 다른 테이블들이 stockId FK로 참조한다.
export const stocks = pgTable('stocks', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(), // 종목코드 (예: '005930', 'AAPL')
  name: varchar('name', { length: 100 }).notNull(), // 종목명 (예: '삼성전자', 'Apple')
  market: marketEnum('market').notNull(), // 소속 시장
  sector: varchar('sector', { length: 100 }), // 업종 (예: '반도체', 'Technology')
  description: text('description'), // 종목 설명
  isActive: boolean('is_active').notNull().default(true), // 비활성 종목 필터링용
  summary: text('summary'), // AI 한줄평 (analyzer가 30분마다 갱신)
  summaryUpdatedAt: timestamp('summary_updated_at', { withTimezone: true }), // 한줄평 갱신 시각
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── stock_prices (종목 시세) ───
// 크롤링 시점의 가격·투자지표 스냅샷. 크롤링할 때마다 행이 쌓인다.
export const stockPrices = pgTable('stock_prices', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stocks.id),
  currentPrice: integer('current_price'), // 현재가 (원)
  changeRate: decimal('change_rate', { precision: 8, scale: 4 }), // 등락률 (%)
  volume: bigint('volume', { mode: 'number' }), // 거래량
  marketCap: bigint('market_cap', { mode: 'number' }), // 시가총액
  per: decimal('per', { precision: 8, scale: 2 }), // 주가수익비율
  pbr: decimal('pbr', { precision: 8, scale: 2 }), // 주가순자산비율
  dividendYield: decimal('dividend_yield', { precision: 6, scale: 2 }), // 배당수익률 (%)
  high52w: integer('high_52w'), // 52주 최고가
  low52w: integer('low_52w'), // 52주 최저가
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── posts (크롤링 글/댓글) ───
// 커뮤니티(네이버·토스)에서 크롤링한 글/댓글. LLM 감성분석 결과도 이 테이블에 저장된다.
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stocks.id),
  source: sourceEnum('source').notNull(), // 크롤링 출처 (NAVER, TOSS)
  type: postTypeEnum('type').notNull().default('POST'), // 글(POST) 또는 댓글(COMMENT)
  externalId: varchar('external_id', { length: 100 }), // 원본 글 ID (네이버 nid 등, 중복 크롤링 방지)
  parentId: integer('parent_id').references((): any => posts.id), // 댓글이면 부모 글 ID (자기참조 FK)
  title: varchar('title', { length: 500 }), // 글 제목 (댓글은 null)
  content: text('content').notNull(), // 본문
  viewCount: integer('view_count').notNull().default(0), // 조회수
  likeCount: integer('like_count').notNull().default(0), // 추천수
  dislikeCount: integer('dislike_count').notNull().default(0), // 비추천수
  sentimentLabel: sentimentEnum('sentiment_label'), // LLM 감성분석 결과 (null = 미분석)
  sentimentReason: text('sentiment_reason'), // 감성 판단 사유
  analyzedAt: timestamp('analyzed_at', { withTimezone: true }), // 분석 시점
  postedAt: timestamp('posted_at', { withTimezone: true }), // 원본 작성 시각
  crawledAt: timestamp('crawled_at', { withTimezone: true })
    .notNull()
    .defaultNow(), // 크롤링 시각
});

// ─── news (뉴스 링크) ───
// 종목 관련 뉴스 기사. 본문 없이 제목+URL만 저장하는 가벼운 구조.
export const news = pgTable('news', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stocks.id),
  title: varchar('title', { length: 500 }).notNull(), // 기사 제목
  url: varchar('url', { length: 1000 }).notNull(), // 기사 원문 링크
  source: varchar('source', { length: 100 }), // 언론사명
  publishedAt: timestamp('published_at', { withTimezone: true }), // 기사 발행 시각
  crawledAt: timestamp('crawled_at', { withTimezone: true })
    .notNull()
    .defaultNow(), // 크롤링 시각
});

// ─── market_summary (전체 시장 한줄평) ───
// analyzer가 30분마다 전 종목 평균 지표로 한줄평을 생성하여 저장. 항상 1행만 유지.
export const marketSummary = pgTable('market_summary', {
  id: serial('id').primaryKey(),
  summary: text('summary').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── index_snapshots (지표 스냅샷) ───
// 크롤링 → 감성분석 → 지표 산출의 최종 결과물. 시계열로 쌓여 차트·대시보드에 사용된다.
export const indexSnapshots = pgTable('index_snapshots', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id').references(() => stocks.id), // null이면 전체 시장 지표, 있으면 개별 종목 지표
  indexType: indexTypeEnum('index_type').notNull(), // 지표 종류 (SB, GAZUA, FEAR_GREED)
  indexValue: decimal('index_value', { precision: 6, scale: 2 }).notNull(), // 최종 지표값 (예: 0~100)
  rawScore: decimal('raw_score', { precision: 10, scale: 4 }).notNull(), // 정규화 전 원시 점수
  totalPosts: integer('total_posts').notNull().default(0), // 집계에 사용된 글 수
  postChangeRate: decimal('post_change_rate', { precision: 8, scale: 2 }), // 전 구간 대비 글 증가율 (%)
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(), // 집계 구간 시작
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(), // 집계 구간 종료
  periodType: periodTypeEnum('period_type').notNull(), // 집계 주기 (HOURLY, DAILY)
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
