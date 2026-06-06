CREATE TABLE "service_variant" (
	"id" text PRIMARY KEY NOT NULL,
	"service_id" text NOT NULL,
	"name" text NOT NULL,
	"price" numeric(12, 2),
	"stock" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service" ADD COLUMN "tracks_stock" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "service_image" ADD COLUMN "variant_id" text;--> statement-breakpoint
ALTER TABLE "service_variant" ADD CONSTRAINT "service_variant_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_variant_service_idx" ON "service_variant" USING btree ("service_id");--> statement-breakpoint
ALTER TABLE "service_image" ADD CONSTRAINT "service_image_variant_id_service_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."service_variant"("id") ON DELETE cascade ON UPDATE no action;