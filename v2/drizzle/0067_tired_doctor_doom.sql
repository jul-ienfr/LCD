CREATE TABLE "fournisseurs_canaux" (
	"code" text PRIMARY KEY NOT NULL,
	"actif" boolean DEFAULT false NOT NULL,
	"ordre" integer DEFAULT 100 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "logements_fournisseurs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"fournisseur_code" text NOT NULL,
	"external_property_id" text,
	"external_room_type_id" text,
	"actif" boolean DEFAULT true NOT NULL,
	"derniere_sync" timestamp with time zone,
	"dernier_statut" text,
	"dernier_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "logements_fournisseurs" ADD CONSTRAINT "logements_fournisseurs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logements_fournisseurs" ADD CONSTRAINT "logements_fournisseurs_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logements_fournisseurs" ADD CONSTRAINT "logements_fournisseurs_fournisseur_code_fournisseurs_canaux_code_fk" FOREIGN KEY ("fournisseur_code") REFERENCES "public"."fournisseurs_canaux"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "logements_fournisseurs_logement_uq" ON "logements_fournisseurs" USING btree ("logement_id");--> statement-breakpoint
CREATE INDEX "logements_fournisseurs_tenant_idx" ON "logements_fournisseurs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "logements_fournisseurs_code_idx" ON "logements_fournisseurs" USING btree ("fournisseur_code");--> statement-breakpoint
INSERT INTO "fournisseurs_canaux" ("code", "actif", "ordre")
VALUES
  ('beds24', false, 10),
  ('channex', false, 20),
  ('smoobu', false, 30),
  ('hostport', false, 40),
  ('nobeds', false, 50)
ON CONFLICT ("code") DO NOTHING;--> statement-breakpoint
ALTER TABLE "logements_fournisseurs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY logements_fournisseurs_isolation ON "logements_fournisseurs"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT ON "fournisseurs_canaux" TO lcd_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "logements_fournisseurs" TO lcd_app;
  END IF;
END $$;