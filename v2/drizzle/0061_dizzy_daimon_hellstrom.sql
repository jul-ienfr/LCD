CREATE TABLE "imports_banque" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"nom_fichier" text NOT NULL,
	"periode_debut" text NOT NULL,
	"periode_fin" text NOT NULL,
	"total_credits_centimes" integer NOT NULL,
	"total_debits_centimes" integer NOT NULL,
	"attendus_centimes" integer NOT NULL,
	"ecart_bp" integer NOT NULL,
	"lignes_total" integer NOT NULL,
	"lignes_rapprochees" integer NOT NULL,
	"lignes_orphelines" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lignes_banque" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"import_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"date_operation" text NOT NULL,
	"libelle" text NOT NULL,
	"montant_centimes" integer NOT NULL,
	"paiement_id" uuid,
	"statut" text DEFAULT 'orpheline' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "imports_banque" ADD CONSTRAINT "imports_banque_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lignes_banque" ADD CONSTRAINT "lignes_banque_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lignes_banque" ADD CONSTRAINT "lignes_banque_import_id_imports_banque_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."imports_banque"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lignes_banque" ADD CONSTRAINT "lignes_banque_paiement_id_paiements_id_fk" FOREIGN KEY ("paiement_id") REFERENCES "public"."paiements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "imports_banque_tenant_ref_uq" ON "imports_banque" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "imports_banque_tenant_date_idx" ON "imports_banque" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "lignes_banque_tenant_ref_uq" ON "lignes_banque" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "lignes_banque_import_idx" ON "lignes_banque" USING btree ("import_id");--> statement-breakpoint
CREATE INDEX "lignes_banque_tenant_statut_idx" ON "lignes_banque" USING btree ("tenant_id","statut");--> statement-breakpoint
ALTER TABLE "imports_banque" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "imports_banque_isolation" ON "imports_banque"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "lignes_banque" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "lignes_banque_isolation" ON "lignes_banque"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "imports_banque" TO lcd_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "lignes_banque" TO lcd_app;
  END IF;
END $$;
