-- US7 (T702) : clés API et intégrations partenaires par tenant.
-- Les secrets des clés API ne sont jamais stockés : seule l'empreinte SHA-256
-- l'est. La fonction `api_cle_par_hash` est le seul accès cross-tenant, car la
-- clé est présentée avant que le tenant ne soit connu.

CREATE TABLE "cles_api" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nom" text NOT NULL,
	"prefixe" text NOT NULL,
	"hash" text NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expire_le" timestamp with time zone,
	"dernier_usage_le" timestamp with time zone,
	"revoque_le" timestamp with time zone,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "cles_api" ADD CONSTRAINT "cles_api_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cles_api" ADD CONSTRAINT "cles_api_scopes_tableau" CHECK (jsonb_typeof("scopes") = 'array');--> statement-breakpoint
CREATE UNIQUE INDEX "cles_api_hash_uq" ON "cles_api" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "cles_api_tenant_cree_idx" ON "cles_api" USING btree ("tenant_id","cree_le");--> statement-breakpoint
ALTER TABLE "cles_api" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY cles_api_isolation ON "cles_api"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "cles_api" TO lcd_app;
  END IF;
END $$;--> statement-breakpoint

-- Lecture contrôlée par empreinte, avant tout contexte tenant.
-- SECURITY DEFINER + search_path figé : ne retourne qu'une ligne et aucun secret.
CREATE OR REPLACE FUNCTION api_cle_par_hash(p_hash text)
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  nom text,
  prefixe text,
  scopes jsonb,
  expire_le timestamp with time zone,
  dernier_usage_le timestamp with time zone,
  revoque_le timestamp with time zone,
  cree_le timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.tenant_id, c.nom, c.prefixe, c.scopes,
         c.expire_le, c.dernier_usage_le, c.revoque_le, c.cree_le
  FROM cles_api c
  WHERE c.hash = p_hash
  LIMIT 1;
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION api_cle_par_hash(text) FROM PUBLIC;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT EXECUTE ON FUNCTION api_cle_par_hash(text) TO lcd_app;
  END IF;
END $$;--> statement-breakpoint

CREATE TABLE "integrations_tenant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"fournisseur" text NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "integrations_tenant" ADD CONSTRAINT "integrations_tenant_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations_tenant" ADD CONSTRAINT "integrations_tenant_fournisseur_valide" CHECK ("fournisseur" IN ('nuki','duve','touchstay','swikly','zapier'));--> statement-breakpoint
ALTER TABLE "integrations_tenant" ADD CONSTRAINT "integrations_tenant_config_objet" CHECK (jsonb_typeof("config") = 'object');--> statement-breakpoint
CREATE UNIQUE INDEX "integrations_tenant_fournisseur_uq" ON "integrations_tenant" USING btree ("tenant_id","fournisseur");--> statement-breakpoint
ALTER TABLE "integrations_tenant" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY integrations_tenant_isolation ON "integrations_tenant"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "integrations_tenant" TO lcd_app;
  END IF;
END $$;
