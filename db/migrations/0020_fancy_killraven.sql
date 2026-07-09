ALTER TABLE "salon_settings" ADD COLUMN "sku_seq_product" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "salon_settings" ADD COLUMN "sku_seq_service" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "service" ADD COLUMN "sku" text;--> statement-breakpoint
ALTER TABLE "service_variant" ADD COLUMN "sku" text;--> statement-breakpoint
CREATE UNIQUE INDEX "service_sku_salon_uidx" ON "service" USING btree ("salon_id","sku");--> statement-breakpoint
CREATE UNIQUE INDEX "service_variant_sku_uidx" ON "service_variant" USING btree ("service_id","sku");--> statement-breakpoint
-- Backfill: sequential SKUs per salón (P-#### products, S-#### services) by creation order.
WITH numbered AS (
  SELECT id,
         measure_type,
         row_number() OVER (PARTITION BY salon_id, measure_type ORDER BY created_at, id) AS rn
  FROM "service"
)
UPDATE "service" s
SET sku = (CASE WHEN n.measure_type = 'duration' THEN 'S-' ELSE 'P-' END) || lpad(n.rn::text, 4, '0')
FROM numbered n
WHERE n.id = s.id AND s.sku IS NULL;--> statement-breakpoint
-- Backfill: variant SKUs = item SKU + 2-digit suffix by creation order.
WITH numbered AS (
  SELECT v.id,
         s.sku AS base,
         row_number() OVER (PARTITION BY v.service_id ORDER BY v.created_at, v.id) AS rn
  FROM "service_variant" v
  JOIN "service" s ON s.id = v.service_id
)
UPDATE "service_variant" v
SET sku = n.base || '-' || lpad(n.rn::text, 2, '0')
FROM numbered n
WHERE n.id = v.id AND v.sku IS NULL AND n.base IS NOT NULL;--> statement-breakpoint
-- Ensure a salon_settings row exists for every salón with catalog entries
-- (the app increments SKU sequences on that row).
INSERT INTO "salon_settings" (id, team_id)
SELECT gen_random_uuid()::text, t.id
FROM "team" t
WHERE EXISTS (SELECT 1 FROM "service" s WHERE s.salon_id = t.id)
  AND NOT EXISTS (SELECT 1 FROM "salon_settings" ss WHERE ss.team_id = t.id);--> statement-breakpoint
-- Seed the per-salón sequences from the highest backfilled SKU.
UPDATE "salon_settings" ss
SET sku_seq_product = COALESCE((
      SELECT max(substring(s.sku FROM 3)::int) FROM "service" s
      WHERE s.salon_id = ss.team_id AND s.sku LIKE 'P-%'
    ), 0),
    sku_seq_service = COALESCE((
      SELECT max(substring(s.sku FROM 3)::int) FROM "service" s
      WHERE s.salon_id = ss.team_id AND s.sku LIKE 'S-%'
    ), 0);