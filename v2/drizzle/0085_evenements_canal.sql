CREATE TABLE "evenements_canal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_fournisseur_id" uuid NOT NULL,
	"fournisseur_code" text NOT NULL,
	"type" text NOT NULL,
	"external_id" text,
	"cle_idempotence" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"statut" text DEFAULT 'recu' NOT NULL,
	"message" text,
	"traite_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evenements_canal" ADD CONSTRAINT "evenements_canal_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evenements_canal" ADD CONSTRAINT "evenements_canal_logement_fournisseur_id_logements_fournisseurs_id_fk" FOREIGN KEY ("logement_fournisseur_id") REFERENCES "public"."logements_fournisseurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evenements_canal" ADD CONSTRAINT "evenements_canal_fournisseur_code_fournisseurs_canaux_code_fk" FOREIGN KEY ("fournisseur_code") REFERENCES "public"."fournisseurs_canaux"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "evenements_canal_cle_uq" ON "evenements_canal" USING btree ("cle_idempotence");--> statement-breakpoint
CREATE INDEX "evenements_canal_tenant_date_idx" ON "evenements_canal" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "evenements_canal_mapping_date_idx" ON "evenements_canal" USING btree ("logement_fournisseur_id","created_at");--> statement-breakpoint
CREATE INDEX "evenements_canal_code_date_idx" ON "evenements_canal" USING btree ("fournisseur_code","created_at");--> statement-breakpoint
ALTER TABLE "evenements_canal" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY evenements_canal_isolation ON "evenements_canal"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "evenements_canal" TO lcd_app;
  END IF;
END $$;