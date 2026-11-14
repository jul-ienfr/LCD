CREATE TABLE "paiements_proprietaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"proprietaire_id" text NOT NULL,
	"releve_id" uuid,
	"ref" text NOT NULL,
	"montant_attendu_centimes" integer NOT NULL,
	"montant_paye_centimes" integer,
	"mode" text DEFAULT 'virement' NOT NULL,
	"statut" text DEFAULT 'en_attente' NOT NULL,
	"date_paiement" date,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "paiements_proprietaires" ADD CONSTRAINT "paiements_proprietaires_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paiements_proprietaires" ADD CONSTRAINT "paiements_proprietaires_proprietaire_id_users_id_fk" FOREIGN KEY ("proprietaire_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paiements_proprietaires" ADD CONSTRAINT "paiements_proprietaires_releve_id_releves_proprietaires_id_fk" FOREIGN KEY ("releve_id") REFERENCES "public"."releves_proprietaires"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paiements_proprietaires" ADD CONSTRAINT "paiements_proprietaires_statut_valide" CHECK ("statut" IN ('en_attente','valide','paye','rapproche'));--> statement-breakpoint
ALTER TABLE "paiements_proprietaires" ADD CONSTRAINT "paiements_proprietaires_mode_valide" CHECK ("mode" IN ('virement','cheque','especes','autre'));--> statement-breakpoint
ALTER TABLE "paiements_proprietaires" ADD CONSTRAINT "paiements_proprietaires_montants_valides" CHECK ("montant_attendu_centimes" >= 0 AND ("montant_paye_centimes" IS NULL OR "montant_paye_centimes" >= 0));--> statement-breakpoint
ALTER TABLE "paiements_proprietaires" ADD CONSTRAINT "paiements_proprietaires_coherence_paiement" CHECK (("statut" IN ('en_attente','valide') AND "montant_paye_centimes" IS NULL AND "date_paiement" IS NULL) OR ("statut" IN ('paye','rapproche') AND "montant_paye_centimes" IS NOT NULL AND "date_paiement" IS NOT NULL));--> statement-breakpoint
CREATE UNIQUE INDEX "paiements_proprietaires_tenant_ref_uq" ON "paiements_proprietaires" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "paiements_proprietaires_tenant_proprietaire_idx" ON "paiements_proprietaires" USING btree ("tenant_id","proprietaire_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX "paiements_proprietaires_releve_idx" ON "paiements_proprietaires" USING btree ("tenant_id","releve_id");--> statement-breakpoint
CREATE INDEX "paiements_proprietaires_tenant_statut_idx" ON "paiements_proprietaires" USING btree ("tenant_id","statut","created_at" DESC);--> statement-breakpoint
ALTER TABLE "paiements_proprietaires" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY paiements_proprietaires_isolation ON "paiements_proprietaires"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "paiements_proprietaires" TO lcd_app;
  END IF;
END $$;
