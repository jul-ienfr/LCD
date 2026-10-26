CREATE TABLE "preferences_sejour" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"menage_frequence_j" integer DEFAULT 0 NOT NULL,
	"linge_inclus" boolean DEFAULT true NOT NULL,
	"heure_arrivee" text,
	"consignes" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "preferences_sejour" ADD CONSTRAINT "preferences_sejour_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences_sejour" ADD CONSTRAINT "preferences_sejour_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "preferences_sejour_tenant_reservation_uq" ON "preferences_sejour" USING btree ("tenant_id","reservation_id");
--> statement-breakpoint
ALTER TABLE "preferences_sejour" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "preferences_sejour_isolation" ON "preferences_sejour"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "preferences_sejour" TO lcd_app;
  END IF;
END $$;