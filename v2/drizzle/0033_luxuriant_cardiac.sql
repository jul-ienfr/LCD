CREATE TABLE "consommables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"unite" text DEFAULT 'unité' NOT NULL,
	"seuil" integer DEFAULT 0 NOT NULL,
	"cible" integer DEFAULT 0 NOT NULL,
	"conso_rotation" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mouvements_stock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"consommable_id" uuid NOT NULL,
	"type" text NOT NULL,
	"quantite" integer NOT NULL,
	"avant" integer NOT NULL,
	"apres" integer NOT NULL,
	"qui" text NOT NULL,
	"ref" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consommables" ADD CONSTRAINT "consommables_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consommables" ADD CONSTRAINT "consommables_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_consommable_id_consommables_id_fk" FOREIGN KEY ("consommable_id") REFERENCES "public"."consommables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "consommables_tenant_logement_code_uq" ON "consommables" USING btree ("tenant_id","logement_id","code");--> statement-breakpoint
CREATE INDEX "consommables_logement_idx" ON "consommables" USING btree ("tenant_id","logement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mouvements_stock_tenant_ref_uq" ON "mouvements_stock" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "mouvements_stock_logement_date_idx" ON "mouvements_stock" USING btree ("tenant_id","logement_id","created_at");
--> statement-breakpoint
ALTER TABLE "consommables" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "consommables_isolation" ON "consommables"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "mouvements_stock" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "mouvements_stock_isolation" ON "mouvements_stock"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "consommables", "mouvements_stock" TO lcd_app;
  END IF;
END $$;