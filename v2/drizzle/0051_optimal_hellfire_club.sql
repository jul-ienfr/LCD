CREATE TABLE "messages_voyageur" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"reservation_id" uuid,
	"ref" text NOT NULL,
	"canal" text DEFAULT 'email' NOT NULL,
	"type" text DEFAULT 'j1' NOT NULL,
	"contenu" text NOT NULL,
	"statut" text DEFAULT 'brouillon' NOT NULL,
	"envoye_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages_voyageur" ADD CONSTRAINT "messages_voyageur_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages_voyageur" ADD CONSTRAINT "messages_voyageur_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages_voyageur" ADD CONSTRAINT "messages_voyageur_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "messages_voyageur_tenant_ref_uq" ON "messages_voyageur" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "messages_voyageur_tenant_logement_idx" ON "messages_voyageur" USING btree ("tenant_id","logement_id","created_at");
--> statement-breakpoint
ALTER TABLE "messages_voyageur" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "messages_voyageur_isolation" ON "messages_voyageur"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "messages_voyageur" TO lcd_app;
  END IF;
END $$;