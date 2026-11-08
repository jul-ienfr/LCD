CREATE TABLE "photos_menage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"menage_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"phase" text NOT NULL,
	"chemin" text NOT NULL,
	"content_type" text NOT NULL,
	"taille_octets" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "photos_menage" ADD CONSTRAINT "photos_menage_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos_menage" ADD CONSTRAINT "photos_menage_menage_id_menages_id_fk" FOREIGN KEY ("menage_id") REFERENCES "public"."menages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos_menage" ADD CONSTRAINT "photos_menage_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "photos_menage_tenant_ref_uq" ON "photos_menage" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "photos_menage_tenant_menage_idx" ON "photos_menage" USING btree ("tenant_id","menage_id");--> statement-breakpoint
CREATE INDEX "photos_menage_tenant_logement_created_idx" ON "photos_menage" USING btree ("tenant_id","logement_id","created_at");--> statement-breakpoint
ALTER TABLE "photos_menage" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY photos_menage_isolation ON "photos_menage"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "photos_menage" TO lcd_app;
  END IF;
END $$;