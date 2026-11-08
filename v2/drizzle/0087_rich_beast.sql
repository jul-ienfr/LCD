CREATE TABLE "echeances_paiement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"type" text NOT NULL,
	"montant_centimes" integer NOT NULL,
	"exigible_le" date NOT NULL,
	"statut" text DEFAULT 'a_payer' NOT NULL,
	"paiement_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pages_site" ALTER COLUMN "seo" SET DEFAULT '{"title":"","description":"","ogImage":null}'::jsonb;--> statement-breakpoint
ALTER TABLE "paiements" ALTER COLUMN "facture_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sites_tenants" ALTER COLUMN "seo_defaut" SET DEFAULT '{"title":"","description":"","ogImage":null}'::jsonb;--> statement-breakpoint
ALTER TABLE "cautions" ADD COLUMN "mode" text DEFAULT 'virement' NOT NULL;--> statement-breakpoint
ALTER TABLE "cautions" ADD COLUMN "empreinte_id" text;--> statement-breakpoint
ALTER TABLE "cautions" ADD COLUMN "empreinte_statut" text;--> statement-breakpoint
ALTER TABLE "cautions" ADD COLUMN "montant_capture_centimes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "paiements" ADD COLUMN "reservation_id" uuid;--> statement-breakpoint
ALTER TABLE "paiements" ADD COLUMN "echeance_id" uuid;--> statement-breakpoint
ALTER TABLE "paiements" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "echeances_paiement" ADD CONSTRAINT "echeances_paiement_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "echeances_paiement" ADD CONSTRAINT "echeances_paiement_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "echeances_paiement_reservation_type_uq" ON "echeances_paiement" USING btree ("tenant_id","reservation_id","type");--> statement-breakpoint
CREATE INDEX "echeances_paiement_tenant_statut_idx" ON "echeances_paiement" USING btree ("tenant_id","statut","exigible_le");--> statement-breakpoint
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_echeance_id_echeances_paiement_id_fk" FOREIGN KEY ("echeance_id") REFERENCES "public"."echeances_paiement"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "echeances_paiement" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY echeances_paiement_isolation ON "echeances_paiement"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "echeances_paiement" TO lcd_app;
  END IF;
END $$;