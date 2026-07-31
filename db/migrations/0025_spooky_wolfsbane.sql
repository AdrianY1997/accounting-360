DROP INDEX "reseller_link_client_uidx";--> statement-breakpoint
ALTER TABLE "reseller_link" ADD COLUMN "show_prices" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "reseller_link_client_prices_uidx" ON "reseller_link" USING btree ("client_id","show_prices");