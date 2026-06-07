ALTER TABLE "service_variant" ALTER COLUMN "price" SET DEFAULT '0';--> statement-breakpoint
UPDATE "service_variant" SET "price" = '0' WHERE "price" IS NULL;--> statement-breakpoint
ALTER TABLE "service_variant" ALTER COLUMN "price" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "service_variant" ADD COLUMN "cost_price" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_variant" ADD COLUMN "reseller_price" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_variant" ADD COLUMN "min_price" numeric(12, 2) DEFAULT '0' NOT NULL;