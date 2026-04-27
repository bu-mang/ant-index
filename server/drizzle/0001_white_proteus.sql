CREATE TABLE "market_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "summary_updated_at" timestamp;