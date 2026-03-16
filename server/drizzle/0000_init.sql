CREATE TYPE "public"."index_type" AS ENUM('SB', 'GAZUA', 'FEAR_GREED');--> statement-breakpoint
CREATE TYPE "public"."market" AS ENUM('KOSPI', 'KOSDAQ', 'NASDAQ', 'NYSE');--> statement-breakpoint
CREATE TYPE "public"."period_type" AS ENUM('HOURLY', 'DAILY');--> statement-breakpoint
CREATE TYPE "public"."post_type" AS ENUM('POST', 'COMMENT');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('NAVER', 'TOSS');--> statement-breakpoint
CREATE TABLE "index_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer,
	"index_type" "index_type" NOT NULL,
	"index_value" numeric(6, 2) NOT NULL,
	"raw_score" numeric(10, 4) NOT NULL,
	"total_posts" integer DEFAULT 0 NOT NULL,
	"post_change_rate" numeric(8, 2),
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"period_type" "period_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"title" varchar(500) NOT NULL,
	"url" varchar(1000) NOT NULL,
	"source" varchar(100),
	"published_at" timestamp,
	"crawled_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"source" "source" NOT NULL,
	"type" "post_type" DEFAULT 'POST' NOT NULL,
	"parent_id" integer,
	"title" varchar(500),
	"content" text NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"profanity_score" numeric(8, 4) DEFAULT '0' NOT NULL,
	"euphoria_score" numeric(8, 4) DEFAULT '0' NOT NULL,
	"posted_at" timestamp,
	"crawled_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"current_price" integer,
	"change_rate" numeric(8, 4),
	"volume" bigint,
	"market_cap" bigint,
	"per" numeric(8, 2),
	"pbr" numeric(8, 2),
	"dividend_yield" numeric(6, 2),
	"high_52w" integer,
	"low_52w" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"market" "market" NOT NULL,
	"sector" varchar(100),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stocks_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "index_snapshots" ADD CONSTRAINT "index_snapshots_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_prices" ADD CONSTRAINT "stock_prices_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE no action ON UPDATE no action;