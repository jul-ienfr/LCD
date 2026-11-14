CREATE TABLE "recommandations_prix" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"jour" date NOT NULL,
	"prix_actuel_centimes" integer,
	"prix_recommande_centimes" integer NOT NULL,
	"source" text DEFAULT 'partenaire' NOT NULL,
	"confiance" integer DEFAULT 0 NOT NULL,
	"facteurs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"statut" text DEFAULT 'proposee' NOT NULL,
	"importee_le" timestamp with time zone DEFAULT now() NOT NULL,
	"appliquee_le" timestamp with time zone,
	"appliquee_par" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recommandations_prix" ADD CONSTRAINT "recommandations_prix_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommandations_prix" ADD CONSTRAINT "recommandations_prix_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommandations_prix" ADD CONSTRAINT "recommandations_prix_source_valide" CHECK ("source" IN ('partenaire','local'));--> statement-breakpoint
ALTER TABLE "recommandations_prix" ADD CONSTRAINT "recommandations_prix_statut_valide" CHECK ("statut" IN ('proposee','appliquee','ignoree'));--> statement-breakpoint
ALTER TABLE "recommandations_prix" ADD CONSTRAINT "recommandations_prix_confiance_valide" CHECK ("confiance" >= 0 AND "confiance" <= 100);--> statement-breakpoint
ALTER TABLE "recommandations_prix" ADD CONSTRAINT "recommandations_prix_prix_positifs" CHECK ("prix_recommande_centimes" > 0 AND ("prix_actuel_centimes" IS NULL OR "prix_actuel_centimes" > 0));--> statement-breakpoint
CREATE UNIQUE INDEX "recommandations_prix_tenant_logement_jour_source_uq" ON "recommandations_prix" USING btree ("tenant_id","logement_id","jour","source");--> statement-breakpoint
CREATE INDEX "recommandations_prix_tenant_statut_idx" ON "recommandations_prix" USING btree ("tenant_id","statut","jour");--> statement-breakpoint
ALTER TABLE "recommandations_prix" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY recommandations_prix_isolation ON "recommandations_prix"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "recommandations_prix" TO lcd_app;
  END IF;
END $$;
