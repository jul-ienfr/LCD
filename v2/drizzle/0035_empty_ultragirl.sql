CREATE TABLE "lieux_tourisme" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid,
	"slug" text NOT NULL,
	"nom" text NOT NULL,
	"categorie" text DEFAULT 'visite' NOT NULL,
	"commune" text,
	"acces" text,
	"prix_indicatif" text,
	"lien" text,
	"mode" text,
	"extra_id" text,
	"actif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lieux_tourisme" ADD CONSTRAINT "lieux_tourisme_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lieux_tourisme" ADD CONSTRAINT "lieux_tourisme_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lieux_tourisme_tenant_slug_uq" ON "lieux_tourisme" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "lieux_tourisme_tenant_idx" ON "lieux_tourisme" USING btree ("tenant_id","actif");
--> statement-breakpoint
ALTER TABLE "lieux_tourisme" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "lieux_tourisme_isolation" ON "lieux_tourisme"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "lieux_tourisme" TO lcd_app;
  END IF;
END $$;