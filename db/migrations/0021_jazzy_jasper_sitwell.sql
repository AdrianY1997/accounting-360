ALTER TABLE "salon_settings" ADD COLUMN "store_type" text DEFAULT 'generic' NOT NULL;--> statement-breakpoint
ALTER TABLE "salon_settings" ADD COLUMN "whatsapp" text;--> statement-breakpoint
ALTER TABLE "salon_settings" ADD COLUMN "shipping_info" text;--> statement-breakpoint
ALTER TABLE "service" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "service" ADD COLUMN "features" jsonb;--> statement-breakpoint
ALTER TABLE "service" ADD COLUMN "attributes" jsonb;--> statement-breakpoint
ALTER TABLE "service_category" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "service_category" ADD CONSTRAINT "service_category_parent_id_service_category_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."service_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_category_parent_idx" ON "service_category" USING btree ("parent_id");--> statement-breakpoint
-- Backfill: default public-store WhatsApp for existing salons (per-salón
-- editable in /settings).
UPDATE "salon_settings" SET "whatsapp" = '+573213015880' WHERE "whatsapp" IS NULL;