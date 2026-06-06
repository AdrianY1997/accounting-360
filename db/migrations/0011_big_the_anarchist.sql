ALTER TABLE "sale_item" ALTER COLUMN "quantity" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "sale_item" ALTER COLUMN "quantity" SET DEFAULT '1';--> statement-breakpoint
ALTER TABLE "service" ADD COLUMN "measure_type" text DEFAULT 'quantity' NOT NULL;--> statement-breakpoint
ALTER TABLE "service" ADD COLUMN "price_mode" text DEFAULT 'per_unit' NOT NULL;--> statement-breakpoint
ALTER TABLE "sale_item" ADD COLUMN "measure_type" text DEFAULT 'quantity' NOT NULL;--> statement-breakpoint
ALTER TABLE "sale_item" ADD COLUMN "duration_minutes" integer;