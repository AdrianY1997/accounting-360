ALTER TABLE "client" ADD COLUMN "type" text DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE "service" ADD COLUMN "cost_price" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "service" ADD COLUMN "reseller_price" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "service" ADD COLUMN "min_price" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "sale_item" ADD COLUMN "cost_price" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "commission_rule" ADD COLUMN "base" text DEFAULT 'line' NOT NULL;