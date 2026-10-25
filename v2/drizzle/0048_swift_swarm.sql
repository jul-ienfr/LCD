CREATE TABLE "rgpd_registres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"dpo_nom" text,
	"dpo_contact" text,
	"hebergement" text DEFAULT 'Union européenne' NOT NULL,
	"entrees" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rgpd_registres" ADD CONSTRAINT "rgpd_registres_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rgpd_registres_tenant_uq" ON "rgpd_registres" USING btree ("tenant_id");
--> statement-breakpoint
ALTER TABLE "rgpd_registres" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "rgpd_registres_isolation" ON "rgpd_registres"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "rgpd_registres" TO lcd_app;
  END IF;
END $$;