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

// Enums
export const marketEnum = pgEnum('market', [
  'KOSPI',
  'KOSDAQ',
  'NASDAQ',
  'NYSE',
]);
export const sourceEnum = pgEnum('source', ['NAVER', 'TOSS']);
export const postTypeEnum = pgEnum('post_type', ['POST', 'COMMENT']);
export const sentimentEnum = pgEnum('sentiment', ['BULL', 'BEAR', 'NEUTRAL']);
export const indexTypeEnum = pgEnum('index_type', [
  'SB',
  'GAZUA',
  'FEAR_GREED',
]);
export const periodTypeEnum = pgEnum('period_type', ['HOURLY', 'DAILY']);

// ─── stocks (종목 마스터) ───
export const stocks = pgTable('stocks', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  market: marketEnum('market').notNull(),
  sector: varchar('sector', { length: 100 }),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── stock_prices (종목 시세) ───
export const stockPrices = pgTable('stock_prices', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stocks.id),
  currentPrice: integer('current_price'),
  changeRate: decimal('change_rate', { precision: 8, scale: 4 }),
  volume: bigint('volume', { mode: 'number' }),
  marketCap: bigint('market_cap', { mode: 'number' }),
  per: decimal('per', { precision: 8, scale: 2 }),
  pbr: decimal('pbr', { precision: 8, scale: 2 }),
  dividendYield: decimal('dividend_yield', { precision: 6, scale: 2 }),
  high52w: integer('high_52w'),
  low52w: integer('low_52w'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── posts (크롤링 글/댓글) ───
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stocks.id),
  source: sourceEnum('source').notNull(),
  type: postTypeEnum('type').notNull().default('POST'),
  externalId: varchar('external_id', { length: 100 }), // 원본 글 ID (네이버 nid 등, 중복 방지)
  parentId: integer('parent_id').references((): any => posts.id),
  title: varchar('title', { length: 500 }),
  content: text('content').notNull(),
  viewCount: integer('view_count').notNull().default(0),
  likeCount: integer('like_count').notNull().default(0),
  dislikeCount: integer('dislike_count').notNull().default(0),
  sentimentLabel: sentimentEnum('sentiment_label'), // null = 미분석
  sentimentReason: text('sentiment_reason'),
  analyzedAt: timestamp('analyzed_at'),
  postedAt: timestamp('posted_at'),
  crawledAt: timestamp('crawled_at').notNull().defaultNow(),
});

// ─── news (뉴스 링크) ───
export const news = pgTable('news', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stocks.id),
  title: varchar('title', { length: 500 }).notNull(),
  url: varchar('url', { length: 1000 }).notNull(),
  source: varchar('source', { length: 100 }),
  publishedAt: timestamp('published_at'),
  crawledAt: timestamp('crawled_at').notNull().defaultNow(),
});

// ─── index_snapshots (지표 스냅샷) ───
export const indexSnapshots = pgTable('index_snapshots', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id').references(() => stocks.id), // null = 전체 시장
  indexType: indexTypeEnum('index_type').notNull(),
  indexValue: decimal('index_value', { precision: 6, scale: 2 }).notNull(),
  rawScore: decimal('raw_score', { precision: 10, scale: 4 }).notNull(),
  totalPosts: integer('total_posts').notNull().default(0),
  postChangeRate: decimal('post_change_rate', { precision: 8, scale: 2 }), // 글 증가율 (%)
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  periodType: periodTypeEnum('period_type').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
