CREATE TABLE "landing_pages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar NOT NULL,
	"slug" text NOT NULL,
	"status" varchar DEFAULT 'DRAFT' NOT NULL,
	"featured_image" text,
	"seo_title" text,
	"seo_description" text,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "landing_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "source_meta" jsonb;
