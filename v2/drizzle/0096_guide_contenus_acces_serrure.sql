-- T601 : guide voyageur structuré + accès serrure.
-- guide_contenus : contenu multilingue par section et par logement.
-- acces_serrure : codes d'accès (numériques ou manuels) par logement/réservation.

-- 1. Colonne guide_langue_defaut sur logements (le tel urgence existe déjà).
ALTER TABLE "logements" ADD COLUMN "guide_langue_defaut" text DEFAULT 'fr' NOT NULL;--> statement-breakpoint

-- 2. Table guide_contenus
CREATE TABLE "guide_contenus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"section" text NOT NULL,
	"langue" text NOT NULL,
	"titre" text NOT NULL,
	"corps" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "guide_contenus" ADD CONSTRAINT "guide_contenus_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guide_contenus" ADD CONSTRAINT "guide_contenus_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guide_contenus" ADD CONSTRAINT "guide_contenus_section_valide" CHECK ("section" IN ('arrivee','wifi','sejour','depart','urgence'));--> statement-breakpoint
ALTER TABLE "guide_contenus" ADD CONSTRAINT "guide_contenus_langue_valide" CHECK ("langue" IN ('fr','en','es','it','de','nl'));--> statement-breakpoint
CREATE UNIQUE INDEX "guide_contenus_tenant_logement_section_langue_uq" ON "guide_contenus" USING btree ("tenant_id","logement_id","section","langue");--> statement-breakpoint
CREATE INDEX "guide_contenus_tenant_logement_idx" ON "guide_contenus" USING btree ("tenant_id","logement_id");--> statement-breakpoint
ALTER TABLE "guide_contenus" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY guide_contenus_isolation ON "guide_contenus"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint

-- 3. Table acces_serrure
CREATE TABLE "acces_serrure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"reservation_id" uuid,
	"type" text DEFAULT 'numerique' NOT NULL,
	"code" text,
	"statut" text DEFAULT 'actif' NOT NULL,
	"fournisseur" text,
	"expire_le" timestamp with time zone,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "acces_serrure" ADD CONSTRAINT "acces_serrure_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acces_serrure" ADD CONSTRAINT "acces_serrure_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acces_serrure" ADD CONSTRAINT "acces_serrure_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acces_serrure" ADD CONSTRAINT "acces_serrure_type_valide" CHECK ("type" IN ('numerique','manuel'));--> statement-breakpoint
ALTER TABLE "acces_serrure" ADD CONSTRAINT "acces_serrure_statut_valide" CHECK ("statut" IN ('actif','revoque','expire'));--> statement-breakpoint
CREATE INDEX "acces_serrure_tenant_logement_idx" ON "acces_serrure" USING btree ("tenant_id","logement_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX "acces_serrure_tenant_reservation_idx" ON "acces_serrure" USING btree ("tenant_id","reservation_id");--> statement-breakpoint
CREATE INDEX "acces_serrure_tenant_statut_idx" ON "acces_serrure" USING btree ("tenant_id","statut","created_at" DESC);--> statement-breakpoint
ALTER TABLE "acces_serrure" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY acces_serrure_isolation ON "acces_serrure"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint

-- 4. GRANT conditionnel
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "guide_contenus" TO lcd_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "acces_serrure" TO lcd_app;
  END IF;
END $$;
