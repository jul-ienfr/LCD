-- US6 (T608, T609) : demandes d'extras du voyageur et avis publiés.
-- Aucune écriture n'est appliquée automatiquement : une demande d'extra est
-- validée par le staff, un avis est publié par le staff.

CREATE TABLE "demandes_extra" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"type" text NOT NULL,
	"prix_centimes" integer NOT NULL,
	"message" text,
	"statut" text DEFAULT 'demande' NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"decidee_le" timestamp with time zone,
	"decidee_par" text,
	"motif_refus" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "demandes_extra" ADD CONSTRAINT "demandes_extra_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demandes_extra" ADD CONSTRAINT "demandes_extra_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demandes_extra" ADD CONSTRAINT "demandes_extra_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demandes_extra" ADD CONSTRAINT "demandes_extra_type_valide" CHECK ("type" IN ('depart-tardif','arrivee-anticipee','lit-bebe','menage-supplementaire','transfert','autre'));--> statement-breakpoint
ALTER TABLE "demandes_extra" ADD CONSTRAINT "demandes_extra_statut_valide" CHECK ("statut" IN ('demande','validee','refusee','facturee'));--> statement-breakpoint
ALTER TABLE "demandes_extra" ADD CONSTRAINT "demandes_extra_prix_positif" CHECK ("prix_centimes" > 0 AND "prix_centimes" <= 100000);--> statement-breakpoint
CREATE UNIQUE INDEX "demandes_extra_tenant_ref_uq" ON "demandes_extra" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "demandes_extra_tenant_statut_idx" ON "demandes_extra" USING btree ("tenant_id","statut","cree_le");--> statement-breakpoint
ALTER TABLE "demandes_extra" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY demandes_extra_isolation ON "demandes_extra"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "demandes_extra" TO lcd_app;
  END IF;
END $$;--> statement-breakpoint

CREATE TABLE "avis_voyageur" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"note" integer,
	"commentaire" text,
	"statut" text DEFAULT 'invite' NOT NULL,
	"invite_le" timestamp with time zone DEFAULT now() NOT NULL,
	"recu_le" timestamp with time zone,
	"publie_le" timestamp with time zone,
	"reponse_hote" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "avis_voyageur" ADD CONSTRAINT "avis_voyageur_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avis_voyageur" ADD CONSTRAINT "avis_voyageur_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avis_voyageur" ADD CONSTRAINT "avis_voyageur_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avis_voyageur" ADD CONSTRAINT "avis_voyageur_statut_valide" CHECK ("statut" IN ('invite','recu','publie','masque'));--> statement-breakpoint
ALTER TABLE "avis_voyageur" ADD CONSTRAINT "avis_voyageur_note_valide" CHECK ("note" IS NULL OR ("note" >= 1 AND "note" <= 5));--> statement-breakpoint
ALTER TABLE "avis_voyageur" ADD CONSTRAINT "avis_voyageur_commentaire_longueur" CHECK ("commentaire" IS NULL OR length("commentaire") <= 2000);--> statement-breakpoint
CREATE UNIQUE INDEX "avis_voyageur_tenant_ref_uq" ON "avis_voyageur" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE UNIQUE INDEX "avis_voyageur_tenant_reservation_uq" ON "avis_voyageur" USING btree ("tenant_id","reservation_id");--> statement-breakpoint
CREATE INDEX "avis_voyageur_tenant_logement_statut_idx" ON "avis_voyageur" USING btree ("tenant_id","logement_id","statut");--> statement-breakpoint
ALTER TABLE "avis_voyageur" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY avis_voyageur_isolation ON "avis_voyageur"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "avis_voyageur" TO lcd_app;
  END IF;
END $$;
