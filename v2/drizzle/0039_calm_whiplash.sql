CREATE TABLE "etat_des_lieux_lignes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"etat_des_lieux_id" uuid NOT NULL,
	"bien_id" uuid,
	"qr" text NOT NULL,
	"libelle" text NOT NULL,
	"etat_reference" integer NOT NULL,
	"prix_reference_centimes" integer,
	"etat_constate" integer,
	"manquant" boolean DEFAULT false NOT NULL,
	"commentaire" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etats_des_lieux" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"reservation_id" uuid,
	"ref" text NOT NULL,
	"type" text DEFAULT 'sortie' NOT NULL,
	"date" date NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "etat_des_lieux_lignes" ADD CONSTRAINT "etat_des_lieux_lignes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etat_des_lieux_lignes" ADD CONSTRAINT "etat_des_lieux_lignes_etat_des_lieux_id_etats_des_lieux_id_fk" FOREIGN KEY ("etat_des_lieux_id") REFERENCES "public"."etats_des_lieux"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etat_des_lieux_lignes" ADD CONSTRAINT "etat_des_lieux_lignes_bien_id_biens_id_fk" FOREIGN KEY ("bien_id") REFERENCES "public"."biens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etats_des_lieux" ADD CONSTRAINT "etats_des_lieux_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etats_des_lieux" ADD CONSTRAINT "etats_des_lieux_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etats_des_lieux" ADD CONSTRAINT "etats_des_lieux_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "etat_des_lieux_lignes_etat_idx" ON "etat_des_lieux_lignes" USING btree ("tenant_id","etat_des_lieux_id");--> statement-breakpoint
CREATE UNIQUE INDEX "etats_des_lieux_tenant_ref_uq" ON "etats_des_lieux" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "etats_des_lieux_tenant_date_idx" ON "etats_des_lieux" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE INDEX "etats_des_lieux_logement_idx" ON "etats_des_lieux" USING btree ("tenant_id","logement_id");
--> statement-breakpoint
ALTER TABLE "etats_des_lieux" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "etats_des_lieux_isolation" ON "etats_des_lieux"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "etat_des_lieux_lignes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "etat_des_lieux_lignes_isolation" ON "etat_des_lieux_lignes"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "etats_des_lieux" TO lcd_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "etat_des_lieux_lignes" TO lcd_app;
  END IF;
END $$;