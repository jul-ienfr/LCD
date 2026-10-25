CREATE TABLE "menage_taches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"menage_id" uuid NOT NULL,
	"libelle" text NOT NULL,
	"fait" boolean DEFAULT false NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"reservation_id" uuid,
	"ref" text NOT NULL,
	"date" date NOT NULL,
	"statut" text DEFAULT 'planifie' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menage_taches" ADD CONSTRAINT "menage_taches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menage_taches" ADD CONSTRAINT "menage_taches_menage_id_menages_id_fk" FOREIGN KEY ("menage_id") REFERENCES "public"."menages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menages" ADD CONSTRAINT "menages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menages" ADD CONSTRAINT "menages_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menages" ADD CONSTRAINT "menages_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "menage_taches_tenant_menage_idx" ON "menage_taches" USING btree ("tenant_id","menage_id");--> statement-breakpoint
CREATE UNIQUE INDEX "menages_tenant_ref_uq" ON "menages" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "menages_tenant_logement_date_idx" ON "menages" USING btree ("tenant_id","logement_id","date");
--> statement-breakpoint
ALTER TABLE "menages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "menage_taches" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "menages_isolation" ON "menages"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "menage_taches_isolation" ON "menage_taches"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "menages" TO lcd_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "menage_taches" TO lcd_app;
  END IF;
END $$;