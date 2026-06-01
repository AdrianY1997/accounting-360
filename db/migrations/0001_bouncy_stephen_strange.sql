CREATE TABLE "client" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"salon_id" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"email" text,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_salon_id_team_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_salon_idx" ON "client" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "client_org_idx" ON "client" USING btree ("organization_id");