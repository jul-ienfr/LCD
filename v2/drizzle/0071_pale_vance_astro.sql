CREATE TABLE "restrictions_sejour" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"date" date NOT NULL,
	"sejour_min" integer,
	"sejour_max" integer,
	"arrivee_autorisee" boolean,
	"depart_autorisee" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "restrictions_sejour" ADD CONSTRAINT "restrictions_sejour_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restrictions_sejour" ADD CONSTRAINT "restrictions_sejour_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "restrictions_sejour_tenant_logement_date_uq" ON "restrictions_sejour" USING btree ("tenant_id","logement_id","date");--> statement-breakpoint
CREATE INDEX "restrictions_sejour_tenant_date_idx" ON "restrictions_sejour" USING btree ("tenant_id","date");--> statement-breakpoint
ALTER TABLE "restrictions_sejour" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY restrictions_sejour_isolation ON "restrictions_sejour"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "restrictions_sejour" TO lcd_app;
  END IF;
END $$;