CREATE TABLE "sale" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"salon_id" text NOT NULL,
	"client_id" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_item" (
	"id" text PRIMARY KEY NOT NULL,
	"sale_id" text NOT NULL,
	"service_id" text,
	"staff_id" text,
	"description" text NOT NULL,
	"unit_price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"line_total" numeric(12, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_salon_id_team_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_sale_id_sale_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sale"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_staff_id_user_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sale_salon_idx" ON "sale" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "sale_client_idx" ON "sale" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "sale_item_sale_idx" ON "sale_item" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "sale_item_staff_idx" ON "sale_item" USING btree ("staff_id");