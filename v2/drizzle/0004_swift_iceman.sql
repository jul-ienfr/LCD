CREATE TABLE "facture_lignes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"facture_id" uuid NOT NULL,
	"designation" text NOT NULL,
	"quantite" integer NOT NULL,
	"prix_unitaire_centimes" integer NOT NULL,
	"total_centimes" integer NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "factures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"reservation_id" uuid,
	"numero" text NOT NULL,
	"client_nom" text NOT NULL,
	"client_email" text,
	"date_emission" date NOT NULL,
	"echeance" date,
	"montant_ht_centimes" integer DEFAULT 0 NOT NULL,
	"tva_centimes" integer DEFAULT 0 NOT NULL,
	"taxe_sejour_centimes" integer DEFAULT 0 NOT NULL,
	"montant_ttc_centimes" integer DEFAULT 0 NOT NULL,
	"statut" text DEFAULT 'brouillon' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "facture_lignes" ADD CONSTRAINT "facture_lignes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facture_lignes" ADD CONSTRAINT "facture_lignes_facture_id_factures_id_fk" FOREIGN KEY ("facture_id") REFERENCES "public"."factures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factures" ADD CONSTRAINT "factures_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factures" ADD CONSTRAINT "factures_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factures" ADD CONSTRAINT "factures_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "facture_lignes_facture_idx" ON "facture_lignes" USING btree ("facture_id","ordre");--> statement-breakpoint
CREATE INDEX "facture_lignes_tenant_idx" ON "facture_lignes" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "factures_tenant_numero_uq" ON "factures" USING btree ("tenant_id","numero");--> statement-breakpoint
CREATE INDEX "factures_tenant_date_idx" ON "factures" USING btree ("tenant_id","date_emission");--> statement-breakpoint
CREATE INDEX "factures_tenant_logement_idx" ON "factures" USING btree ("tenant_id","logement_id");