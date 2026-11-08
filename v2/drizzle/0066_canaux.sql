CREATE TABLE "canaux" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"code" text NOT NULL,
	"libelle" text NOT NULL,
	"cle" text NOT NULL,
	"external_listing_id" text,
	"actif" boolean DEFAULT true NOT NULL,
	"export_actif" boolean DEFAULT true NOT NULL,
	"buffer_jours" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flux_ics" ADD COLUMN "canal_id" uuid;--> statement-breakpoint
ALTER TABLE "canaux" ADD CONSTRAINT "canaux_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canaux" ADD CONSTRAINT "canaux_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "canaux_tenant_logement_cle_uq" ON "canaux" USING btree ("tenant_id","logement_id","cle");--> statement-breakpoint
CREATE INDEX "canaux_tenant_logement_idx" ON "canaux" USING btree ("tenant_id","logement_id");--> statement-breakpoint
ALTER TABLE "flux_ics" ADD CONSTRAINT "flux_ics_canal_id_canaux_id_fk" FOREIGN KEY ("canal_id") REFERENCES "public"."canaux"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "flux_ics_canal_uq" ON "flux_ics" USING btree ("canal_id");--> statement-breakpoint
INSERT INTO "canaux" (
	"id",
	"tenant_id",
	"logement_id",
	"code",
	"libelle",
	"cle",
	"external_listing_id",
	"actif",
	"export_actif",
	"buffer_jours",
	"notes"
)
SELECT
	gen_random_uuid(),
	f."tenant_id",
	f."logement_id",
	'generique',
	f."libelle",
	'herite:' || f."id",
	NULL,
	f."actif",
	true,
	0,
	'Canal créé automatiquement depuis un flux ICS existant.'
FROM "flux_ics" f
WHERE f."canal_id" IS NULL;--> statement-breakpoint
UPDATE "flux_ics" f
SET "canal_id" = c."id"
FROM "canaux" c
WHERE c."cle" = 'herite:' || f."id"
  AND f."canal_id" IS NULL;--> statement-breakpoint
ALTER TABLE "canaux" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY canaux_isolation ON "canaux"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "canaux" TO lcd_app;
  END IF;
END $$;