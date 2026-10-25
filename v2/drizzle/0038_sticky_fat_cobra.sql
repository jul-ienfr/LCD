CREATE TABLE "avis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"nom" text NOT NULL,
	"note" integer NOT NULL,
	"commentaire" text DEFAULT '' NOT NULL,
	"statut" text DEFAULT 'publie' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "avis" ADD CONSTRAINT "avis_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avis" ADD CONSTRAINT "avis_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avis" ADD CONSTRAINT "avis_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "avis_tenant_reservation_uq" ON "avis" USING btree ("tenant_id","reservation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "avis_tenant_ref_uq" ON "avis" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "avis_tenant_statut_idx" ON "avis" USING btree ("tenant_id","statut");
--> statement-breakpoint
ALTER TABLE "avis" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "avis_isolation" ON "avis"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "avis" TO lcd_app;
  END IF;
END $$;
