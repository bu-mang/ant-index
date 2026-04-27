ALTER TABLE "index_snapshots" ALTER COLUMN "period_start" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "index_snapshots" ALTER COLUMN "period_end" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "index_snapshots" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "index_snapshots" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "market_summary" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "market_summary" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "news" ALTER COLUMN "published_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "news" ALTER COLUMN "crawled_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "news" ALTER COLUMN "crawled_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "analyzed_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "posted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "crawled_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "crawled_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "stock_prices" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stock_prices" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "stocks" ALTER COLUMN "summary_updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stocks" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stocks" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "stocks" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stocks" ALTER COLUMN "updated_at" SET DEFAULT now();