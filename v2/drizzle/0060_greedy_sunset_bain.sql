CREATE TABLE "fiches_police" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"nom" text NOT NULL,
	"prenoms" text NOT NULL,
	"nationalite" text NOT NULL,
	"date_naissance" text NOT NULL,
	"lieu_naissance" text NOT NULL,
	"domicile" text NOT NULL,
	"telephone" text NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"purge_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fiches_police" ADD CONSTRAINT "fiches_police_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiches_police" ADD CONSTRAINT "fiches_police_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiches_police" ADD CONSTRAINT "fiches_police_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fiches_police_tenant_ref_uq" ON "fiches_police" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "fiches_police_tenant_reservation_idx" ON "fiches_police" USING btree ("tenant_id","reservation_id");--> statement-breakpoint
CREATE INDEX "fiches_police_purge_idx" ON "fiches_police" USING btree ("purge_at");--> statement-breakpoint
ALTER TABLE "fiches_police" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "fiches_police_isolation" ON "fiches_police"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "fiches_police" TO lcd_app;
  END IF;
END $$;
