CREATE TABLE "bien_evenements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"bien_id" uuid NOT NULL,
	"type" text NOT NULL,
	"ref" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"qr" text NOT NULL,
	"categorie" text NOT NULL,
	"label" text NOT NULL,
	"date_achat" date,
	"prix_achat_centimes" integer,
	"fournisseur" text,
	"garantie_fin" date,
	"lavages_nb" integer DEFAULT 0 NOT NULL,
	"utilisations_nb" integer DEFAULT 0 NOT NULL,
	"derniere_utilisation" date,
	"etat" integer DEFAULT 5 NOT NULL,
	"photo_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bien_evenements" ADD CONSTRAINT "bien_evenements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bien_evenements" ADD CONSTRAINT "bien_evenements_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bien_evenements" ADD CONSTRAINT "bien_evenements_bien_id_biens_id_fk" FOREIGN KEY ("bien_id") REFERENCES "public"."biens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biens" ADD CONSTRAINT "biens_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biens" ADD CONSTRAINT "biens_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bien_evenements_tenant_ref_uq" ON "bien_evenements" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "bien_evenements_bien_date_idx" ON "bien_evenements" USING btree ("tenant_id","bien_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "biens_tenant_logement_qr_uq" ON "biens" USING btree ("tenant_id","logement_id","qr");--> statement-breakpoint
CREATE INDEX "biens_logement_idx" ON "biens" USING btree ("tenant_id","logement_id");
--> statement-breakpoint
ALTER TABLE "biens" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "biens_isolation" ON "biens"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "bien_evenements" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "bien_evenements_isolation" ON "bien_evenements"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "biens", "bien_evenements" TO lcd_app;
  END IF;
END $$;