CREATE TABLE "fils_voyageur" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid,
	"reservation_id" uuid,
	"voyageur_nom" text NOT NULL,
	"voyageur_email" text,
	"voyageur_telephone" text,
	"langue" text DEFAULT 'fr' NOT NULL,
	"cle_regroupement" text NOT NULL,
	"consentements" jsonb DEFAULT '{"email":true,"sms":false,"whatsapp":false}'::jsonb NOT NULL,
	"statut" text DEFAULT 'ouvert' NOT NULL,
	"dernier_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pieces_jointes_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"nom_fichier" text NOT NULL,
	"type_mime" text NOT NULL,
	"taille_octets" integer NOT NULL,
	"cle_stockage" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automatisations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"libelle" text NOT NULL,
	"declencheur" text NOT NULL,
	"canal" text DEFAULT 'email' NOT NULL,
	"sujet" text,
	"modele" text NOT NULL,
	"conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "executions_automatisation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"automatisation_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"fil_id" uuid,
	"message_id" uuid,
	"ref" text NOT NULL,
	"statut" text DEFAULT 'brouillon' NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fils_voyageur" ADD CONSTRAINT "fils_voyageur_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fils_voyageur" ADD CONSTRAINT "fils_voyageur_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fils_voyageur" ADD CONSTRAINT "fils_voyageur_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fils_voyageur" ADD CONSTRAINT "fils_voyageur_statut_valide" CHECK ("statut" IN ('ouvert','en_attente','clos'));--> statement-breakpoint
ALTER TABLE "pieces_jointes_message" ADD CONSTRAINT "pieces_jointes_message_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pieces_jointes_message" ADD CONSTRAINT "pieces_jointes_message_message_id_messages_voyageur_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages_voyageur"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pieces_jointes_message" ADD CONSTRAINT "pieces_jointes_message_taille_positive" CHECK ("taille_octets" >= 0);--> statement-breakpoint
ALTER TABLE "automatisations" ADD CONSTRAINT "automatisations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automatisations" ADD CONSTRAINT "automatisations_declencheur_valide" CHECK ("declencheur" IN ('reservation_creee','paiement_recu','j-7','j-1','arrivee','depart','j+1'));--> statement-breakpoint
ALTER TABLE "executions_automatisation" ADD CONSTRAINT "executions_automatisation_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executions_automatisation" ADD CONSTRAINT "executions_automatisation_automatisation_id_automatisations_id_fk" FOREIGN KEY ("automatisation_id") REFERENCES "public"."automatisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executions_automatisation" ADD CONSTRAINT "executions_automatisation_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executions_automatisation" ADD CONSTRAINT "executions_automatisation_fil_id_fils_voyageur_id_fk" FOREIGN KEY ("fil_id") REFERENCES "public"."fils_voyageur"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executions_automatisation" ADD CONSTRAINT "executions_automatisation_message_id_messages_voyageur_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages_voyageur"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fils_voyageur_tenant_cle_uq" ON "fils_voyageur" USING btree ("tenant_id","cle_regroupement");--> statement-breakpoint
CREATE UNIQUE INDEX "fils_voyageur_tenant_reservation_uq" ON "fils_voyageur" USING btree ("tenant_id","reservation_id") WHERE "reservation_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "fils_voyageur_tenant_statut_idx" ON "fils_voyageur" USING btree ("tenant_id","statut","dernier_message_at");--> statement-breakpoint
CREATE INDEX "fils_voyageur_tenant_logement_idx" ON "fils_voyageur" USING btree ("tenant_id","logement_id");--> statement-breakpoint
CREATE INDEX "pieces_jointes_message_tenant_message_idx" ON "pieces_jointes_message" USING btree ("tenant_id","message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "automatisations_tenant_code_uq" ON "automatisations" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "automatisations_tenant_declencheur_idx" ON "automatisations" USING btree ("tenant_id","declencheur","actif");--> statement-breakpoint
CREATE UNIQUE INDEX "executions_automatisation_tenant_ref_uq" ON "executions_automatisation" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "executions_automatisation_tenant_auto_idx" ON "executions_automatisation" USING btree ("tenant_id","automatisation_id","created_at");--> statement-breakpoint
ALTER TABLE "fils_voyageur" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY fils_voyageur_isolation ON "fils_voyageur"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "pieces_jointes_message" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY pieces_jointes_message_isolation ON "pieces_jointes_message"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "automatisations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY automatisations_isolation ON "automatisations"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "executions_automatisation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY executions_automatisation_isolation ON "executions_automatisation"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "messages_voyageur" ADD COLUMN "fil_id" uuid;--> statement-breakpoint
ALTER TABLE "messages_voyageur" ADD COLUMN "sens" text DEFAULT 'sortant' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages_voyageur" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "messages_voyageur" ADD COLUMN "expediteur" text;--> statement-breakpoint
ALTER TABLE "messages_voyageur" ADD COLUMN "lu_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages_voyageur" ADD CONSTRAINT "messages_voyageur_fil_id_fils_voyageur_id_fk" FOREIGN KEY ("fil_id") REFERENCES "public"."fils_voyageur"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages_voyageur" ADD CONSTRAINT "messages_voyageur_sens_valide" CHECK ("sens" IN ('entrant','sortant'));--> statement-breakpoint
CREATE INDEX "messages_voyageur_tenant_fil_idx" ON "messages_voyageur" USING btree ("tenant_id","fil_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_voyageur_tenant_external_uq" ON "messages_voyageur" USING btree ("tenant_id","canal","external_id") WHERE "external_id" IS NOT NULL;--> statement-breakpoint
INSERT INTO "fils_voyageur"
  (tenant_id, logement_id, reservation_id, voyageur_nom, voyageur_email,
   voyageur_telephone, langue, cle_regroupement, consentements, statut,
   dernier_message_at, created_at, updated_at)
SELECT
  r.tenant_id,
  r.logement_id,
  r.id,
  r.client_nom,
  r.client_email,
  NULL,
  'fr',
  CASE
    WHEN r.client_email IS NOT NULL AND btrim(r.client_email) <> ''
      THEN 'email:' || lower(btrim(r.client_email))
    ELSE 'ext:reservation:' || r.id::text
  END,
  '{"email":true,"sms":false,"whatsapp":false}'::jsonb,
  'ouvert',
  m.dernier,
  COALESCE(m.premier, r.created_at),
  now()
FROM "reservations" r
JOIN (
  SELECT reservation_id, max(created_at) AS dernier, min(created_at) AS premier
  FROM "messages_voyageur"
  WHERE reservation_id IS NOT NULL
  GROUP BY reservation_id
) m ON m.reservation_id = r.id;--> statement-breakpoint
UPDATE "messages_voyageur" msg
SET fil_id = f.id
FROM "fils_voyageur" f
WHERE msg.reservation_id = f.reservation_id
  AND msg.tenant_id = f.tenant_id
  AND msg.fil_id IS NULL;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "fils_voyageur" TO lcd_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "pieces_jointes_message" TO lcd_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "automatisations" TO lcd_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "executions_automatisation" TO lcd_app;
  END IF;
END $$;
