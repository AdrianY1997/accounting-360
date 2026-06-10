ALTER TABLE "service_image" ADD COLUMN "stock" integer;--> statement-breakpoint
ALTER TABLE "sale_item" ADD COLUMN "image_id" text;--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_image_id_service_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."service_image"("id") ON DELETE set null ON UPDATE no action;