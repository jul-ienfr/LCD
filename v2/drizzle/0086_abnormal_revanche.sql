CREATE TABLE "domaines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"domaine" text NOT NULL,
	"statut" text DEFAULT 'en_attente' NOT NULL,
	"verification_token" text,
	"certificat_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages_site" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"type" text NOT NULL,
	"logement_id" uuid,
	"template" text DEFAULT 'sejour' NOT NULL,
	"statut" text DEFAULT 'brouillon' NOT NULL,
	"seo" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"langues" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"publie_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid,
	"type" text NOT NULL,
	"valeur" integer NOT NULL,
	"code" text,
	"conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"debut_at" timestamp with time zone,
	"fin_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections_site" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"page_id" uuid NOT NULL,
	"type" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"contenu" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites_tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template" text DEFAULT 'sejour' NOT NULL,
	"langues" jsonb DEFAULT '["fr"]'::jsonb NOT NULL,
	"seo_defaut" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"statut" text DEFAULT 'brouillon' NOT NULL,
	"publie_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "domaines" ADD CONSTRAINT "domaines_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages_site" ADD CONSTRAINT "pages_site_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages_site" ADD CONSTRAINT "pages_site_site_id_sites_tenants_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages_site" ADD CONSTRAINT "pages_site_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections_site" ADD CONSTRAINT "sections_site_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections_site" ADD CONSTRAINT "sections_site_page_id_pages_site_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages_site"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites_tenants" ADD CONSTRAINT "sites_tenants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "domaines_domaine_uq" ON "domaines" USING btree ("domaine");--> statement-breakpoint
CREATE INDEX "domaines_tenant_idx" ON "domaines" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_site_tenant_slug_uq" ON "pages_site" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "pages_site_tenant_site_idx" ON "pages_site" USING btree ("tenant_id","site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "promotions_tenant_code_uq" ON "promotions" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "promotions_tenant_actif_idx" ON "promotions" USING btree ("tenant_id","actif");--> statement-breakpoint
CREATE INDEX "sections_site_page_position_idx" ON "sections_site" USING btree ("tenant_id","page_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "sites_tenants_tenant_uq" ON "sites_tenants" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "sites_tenants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY sites_tenants_isolation ON "sites_tenants"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "pages_site" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY pages_site_isolation ON "pages_site"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "sections_site" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY sections_site_isolation ON "sections_site"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "domaines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY domaines_isolation ON "domaines"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "promotions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY promotions_isolation ON "promotions"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "sites_tenants", "pages_site", "sections_site", "domaines", "promotions" TO lcd_app;
  END IF;
END $$;