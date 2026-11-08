CREATE TABLE "demandes_sejour" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"logement_id" uuid,
	"nom" text NOT NULL,
	"email" text NOT NULL,
	"telephone" text,
	"arrivee" date,
	"depart" date,
	"voyageurs" integer DEFAULT 1 NOT NULL,
	"message" text,
	"statut" text DEFAULT 'nouvelle' NOT NULL,
	"motif_refus" text,
	"reservation_id" uuid,
	"source" text DEFAULT 'site' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "demandes_sejour" ADD CONSTRAINT "demandes_sejour_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demandes_sejour" ADD CONSTRAINT "demandes_sejour_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demandes_sejour" ADD CONSTRAINT "demandes_sejour_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demandes_sejour" ADD CONSTRAINT "demandes_sejour_voyageurs_bornes" CHECK ("voyageurs" BETWEEN 1 AND 20);--> statement-breakpoint
CREATE UNIQUE INDEX "demandes_sejour_tenant_ref_uq" ON "demandes_sejour" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "demandes_sejour_tenant_statut_idx" ON "demandes_sejour" USING btree ("tenant_id","statut","created_at");--> statement-breakpoint
ALTER TABLE "demandes_sejour" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY demandes_sejour_isolation ON "demandes_sejour"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "demandes_sejour" TO lcd_app;
  END IF;
END $$;
