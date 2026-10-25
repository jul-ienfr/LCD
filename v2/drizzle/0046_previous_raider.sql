CREATE TABLE "preuves_tranquillite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"type" text NOT NULL,
	"date" date NOT NULL,
	"moment" text,
	"valeur_db" integer,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "preuves_tranquillite" ADD CONSTRAINT "preuves_tranquillite_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preuves_tranquillite" ADD CONSTRAINT "preuves_tranquillite_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "preuves_tranquillite_tenant_ref_uq" ON "preuves_tranquillite" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "preuves_tranquillite_tenant_logement_date_idx" ON "preuves_tranquillite" USING btree ("tenant_id","logement_id","date");
--> statement-breakpoint
ALTER TABLE "preuves_tranquillite" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "preuves_tranquillite_isolation" ON "preuves_tranquillite"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "preuves_tranquillite" TO lcd_app;
  END IF;
END $$;