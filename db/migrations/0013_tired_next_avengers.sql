CREATE TABLE "member_permission" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"permission" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member_permission" ADD CONSTRAINT "member_permission_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "member_permission_uidx" ON "member_permission" USING btree ("member_id","permission");