CREATE TABLE "objets_trouves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"reservation_id" uuid,
	"ref" text NOT NULL,
	"description" text NOT NULL,
	"lieu" text NOT NULL,
	"trouve_le" date NOT NULL,
	"statut" text DEFAULT 'trouve' NOT NULL,
	"voyageur_nom" text,
	"contact" text,
	"frais_centimes" integer DEFAULT 0 NOT NULL,
	"envoye_le" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "objets_trouves" ADD CONSTRAINT "objets_trouves_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objets_trouves" ADD CONSTRAINT "objets_trouves_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objets_trouves" ADD CONSTRAINT "objets_trouves_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "objets_trouves_tenant_ref_uq" ON "objets_trouves" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "objets_trouves_tenant_logement_statut_idx" ON "objets_trouves" USING btree ("tenant_id","logement_id","statut");
--> statement-breakpoint
ALTER TABLE "objets_trouves" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "objets_trouves_isolation" ON "objets_trouves"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "objets_trouves" TO lcd_app;
  END IF;
END $$;