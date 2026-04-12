ALTER TABLE "orders" ADD COLUMN "bank_transfer_account" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "bank_transfer_receipt_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "bank_transfer_receipt_original_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "bank_transfer_receipt_note" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "bank_transfer_receipt_uploaded_at" timestamp;