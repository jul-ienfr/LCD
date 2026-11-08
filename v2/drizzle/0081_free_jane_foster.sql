CREATE TABLE "config_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"action" text NOT NULL,
	"auteur_email" text NOT NULL,
	"lignes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "config_versions" ADD CONSTRAINT "config_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "config_versions_tenant_ref_uq" ON "config_versions" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "config_versions_tenant_created_idx" ON "config_versions" USING btree ("tenant_id","created_at");--> statement-breakpoint
ALTER TABLE "config_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY config_versions_isolation ON "config_versions"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "config_versions" TO lcd_app;
  END IF;
END $$;