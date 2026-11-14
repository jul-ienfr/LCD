-- T720 (révisé 2026-11-10) — mesure d'audience, publicité et consentement.
--
-- `suivi_configuration` porte les identifiants par tenant (aucun secret).
-- `suivi_evenements` est un journal first-party borné : l'IP n'est jamais
-- stockée en clair, seulement son empreinte SHA-256 salée ; aucun e-mail,
-- téléphone ou nom n'est accepté. Purge à 13 mois via scripts/purger-suivi.ts.

CREATE TABLE "suivi_configuration" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"actif" boolean DEFAULT false NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "suivi_configuration" ADD CONSTRAINT "suivi_configuration_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suivi_configuration" ADD CONSTRAINT "suivi_configuration_objet" CHECK (jsonb_typeof("configuration") = 'object');--> statement-breakpoint
ALTER TABLE "suivi_configuration" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY suivi_configuration_isolation ON "suivi_configuration"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "suivi_configuration" TO lcd_app;
  END IF;
END $$;--> statement-breakpoint

CREATE TABLE "suivi_evenements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"visiteur_id" text NOT NULL,
	"session_id" text NOT NULL,
	"type" text NOT NULL,
	"nom" text NOT NULL,
	"page" text NOT NULL,
	"referrer" text,
	"campagne" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"valeur_centimes" bigint,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"consentement" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "suivi_evenements" ADD CONSTRAINT "suivi_evenements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suivi_evenements" ADD CONSTRAINT "suivi_evenements_type_valide" CHECK ("type" IN ('page_vue','clic','soumission','conversion','achat','autre'));--> statement-breakpoint
ALTER TABLE "suivi_evenements" ADD CONSTRAINT "suivi_evenements_campagne_objet" CHECK (jsonb_typeof("campagne") = 'object');--> statement-breakpoint
ALTER TABLE "suivi_evenements" ADD CONSTRAINT "suivi_evenements_metadata_objet" CHECK (jsonb_typeof("metadata") = 'object');--> statement-breakpoint
CREATE INDEX "suivi_evenements_tenant_cree_idx" ON "suivi_evenements" USING btree ("tenant_id","cree_le");--> statement-breakpoint
CREATE INDEX "suivi_evenements_tenant_type_cree_idx" ON "suivi_evenements" USING btree ("tenant_id","type","cree_le");--> statement-breakpoint
CREATE INDEX "suivi_evenements_tenant_visiteur_idx" ON "suivi_evenements" USING btree ("tenant_id","visiteur_id","cree_le");--> statement-breakpoint
ALTER TABLE "suivi_evenements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY suivi_evenements_isolation ON "suivi_evenements"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, DELETE ON "suivi_evenements" TO lcd_app;
  END IF;
END $$;
