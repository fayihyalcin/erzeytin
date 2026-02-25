CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"username" varchar NOT NULL,
	"full_name" text DEFAULT '' NOT NULL,
	"password_hash" varchar NOT NULL,
	"role" varchar DEFAULT 'ADMIN' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" text,
	"image_url" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"seo_keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "order_activities" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"order_id" uuid NOT NULL,
	"actor_id" uuid,
	"actor_username" text,
	"event_type" text NOT NULL,
	"message" text NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"order_number" varchar NOT NULL,
	"customer_name" varchar NOT NULL,
	"customer_email" varchar NOT NULL,
	"customer_phone" text,
	"shipping_address" jsonb NOT NULL,
	"billing_address" jsonb,
	"items" jsonb NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"shipping_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"grand_total" numeric(10, 2) NOT NULL,
	"currency" varchar DEFAULT 'TRY' NOT NULL,
	"status" varchar DEFAULT 'NEW' NOT NULL,
	"payment_status" varchar DEFAULT 'PENDING' NOT NULL,
	"payment_method" varchar DEFAULT 'CARD' NOT NULL,
	"payment_provider" text,
	"payment_transaction_id" text,
	"fulfillment_status" varchar DEFAULT 'UNFULFILLED' NOT NULL,
	"customer_note" text,
	"admin_note" text,
	"source" varchar DEFAULT 'WEBSITE' NOT NULL,
	"assigned_representative_id" uuid,
	"assignment_note" text,
	"assigned_at" timestamp,
	"shipping_method" text,
	"shipping_company" text,
	"tracking_number" text,
	"tracking_url" text,
	"stock_deducted" boolean DEFAULT true NOT NULL,
	"placed_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"confirmed_at" timestamp,
	"shipped_at" timestamp,
	"delivered_at" timestamp,
	"cancelled_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar NOT NULL,
	"slug" text,
	"sku" varchar NOT NULL,
	"barcode" text,
	"brand" text,
	"price" numeric(10, 2) NOT NULL,
	"compare_at_price" numeric(10, 2),
	"cost_price" numeric(10, 2),
	"tax_rate" numeric(5, 2) DEFAULT '20' NOT NULL,
	"vat_included" boolean DEFAULT true NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"min_stock" integer DEFAULT 0 NOT NULL,
	"weight" numeric(10, 3),
	"width" numeric(10, 2),
	"height" numeric(10, 2),
	"length" numeric(10, 2),
	"short_description" text,
	"description" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured_image" text,
	"has_variants" boolean DEFAULT false NOT NULL,
	"variants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pricing_policy" jsonb DEFAULT '{"fixedCost":0,"shippingCost":0,"packagingCost":0,"marketingPercent":0,"paymentFeePercent":0,"operationalPercent":0,"targetMarginPercent":30,"discountBufferPercent":0,"platformCommissionPercent":0}'::jsonb NOT NULL,
	"expense_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pricing_summary" jsonb DEFAULT '{"unitCost":0,"estimatedProfit":0,"minimumNetPrice":0,"fixedExpenseTotal":0,"suggestedNetPrice":0,"suggestedSalePrice":0,"estimatedMarginPercent":0,"variableExpensePercent":0}'::jsonb NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"seo_keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"category_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_sku_unique" UNIQUE("sku"),
	CONSTRAINT "products_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"key" varchar NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "order_activities" ADD CONSTRAINT "order_activities_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_activities" ADD CONSTRAINT "order_activities_actor_id_admin_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_representative_id_admin_users_id_fk" FOREIGN KEY ("assigned_representative_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
