CREATE TABLE "releves_proprietaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"proprietaire_id" text NOT NULL,
	"proprietaire_nom" text NOT NULL,
	"mois_debut" text NOT NULL,
	"mois_fin" text NOT NULL,
	"periode" text DEFAULT 'mensuel' NOT NULL,
	"lignes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_ca_centimes" integer NOT NULL,
	"total_commission_centimes" integer NOT NULL,
	"total_charges_centimes" integer NOT NULL,
	"total_net_centimes" integer NOT NULL,
	"genere_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "releves_proprietaires" ADD CONSTRAINT "releves_proprietaires_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releves_proprietaires" ADD CONSTRAINT "releves_proprietaires_proprietaire_id_users_id_fk" FOREIGN KEY ("proprietaire_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releves_proprietaires" ADD CONSTRAINT "releves_proprietaires_periode_valide" CHECK ("periode" IN ('mensuel','trimestriel'));--> statement-breakpoint
ALTER TABLE "releves_proprietaires" ADD CONSTRAINT "releves_proprietaires_montants_valides" CHECK ("total_ca_centimes" >= 0 AND "total_commission_centimes" >= 0 AND "total_charges_centimes" >= 0);--> statement-breakpoint
CREATE UNIQUE INDEX "releves_proprietaires_tenant_proprietaire_periode_uq" ON "releves_proprietaires" USING btree ("tenant_id","proprietaire_id","mois_debut","periode");--> statement-breakpoint
CREATE INDEX "releves_proprietaires_tenant_genere_idx" ON "releves_proprietaires" USING btree ("tenant_id","genere_at" DESC);--> statement-breakpoint
ALTER TABLE "releves_proprietaires" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY releves_proprietaires_isolation ON "releves_proprietaires"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "releves_proprietaires" TO lcd_app;
  END IF;
END $$;
--> statement-breakpoint
CREATE TABLE "envois_releves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"releve_id" uuid NOT NULL,
	"proprietaire_id" text NOT NULL,
	"canal" text DEFAULT 'email' NOT NULL,
	"destinataire" text NOT NULL,
	"envoi_ref" text NOT NULL,
	"envoye_at" timestamp with time zone NOT NULL,
	"statut" text DEFAULT 'envoye' NOT NULL,
	"erreur" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "envois_releves" ADD CONSTRAINT "envois_releves_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envois_releves" ADD CONSTRAINT "envois_releves_releve_id_releves_proprietaires_id_fk" FOREIGN KEY ("releve_id") REFERENCES "public"."releves_proprietaires"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envois_releves" ADD CONSTRAINT "envois_releves_proprietaire_id_users_id_fk" FOREIGN KEY ("proprietaire_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envois_releves" ADD CONSTRAINT "envois_releves_canal_valide" CHECK ("canal" IN ('email','portail'));--> statement-breakpoint
ALTER TABLE "envois_releves" ADD CONSTRAINT "envois_releves_statut_valide" CHECK ("statut" IN ('envoye','echec','consulte','telecharge'));--> statement-breakpoint
CREATE UNIQUE INDEX "envois_releves_tenant_ref_uq" ON "envois_releves" USING btree ("tenant_id","envoi_ref");--> statement-breakpoint
CREATE INDEX "envois_releves_releve_idx" ON "envois_releves" USING btree ("tenant_id","releve_id");--> statement-breakpoint
ALTER TABLE "envois_releves" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY envois_releves_isolation ON "envois_releves"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "envois_releves" TO lcd_app;
  END IF;
END $$;
