CREATE TABLE "plans_tarifaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"nom" text NOT NULL,
	"code" text NOT NULL,
	"external_rate_plan_id" text,
	"priorite" integer DEFAULT 0 NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "restrictions_sejour_tenant_logement_date_uq";--> statement-breakpoint
DROP INDEX "tarifs_tenant_logement_date_uq";--> statement-breakpoint
ALTER TABLE "restrictions_sejour" ADD COLUMN "plan_tarifaire_id" uuid;--> statement-breakpoint
ALTER TABLE "tarifs" ADD COLUMN "plan_tarifaire_id" uuid;--> statement-breakpoint
ALTER TABLE "plans_tarifaires" ADD CONSTRAINT "plans_tarifaires_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans_tarifaires" ADD CONSTRAINT "plans_tarifaires_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "plans_tarifaires_tenant_logement_code_uq" ON "plans_tarifaires" USING btree ("tenant_id","logement_id","code");--> statement-breakpoint
CREATE INDEX "plans_tarifaires_tenant_logement_actif_idx" ON "plans_tarifaires" USING btree ("tenant_id","logement_id","actif");--> statement-breakpoint
ALTER TABLE "restrictions_sejour" ADD CONSTRAINT "restrictions_sejour_plan_tarifaire_id_plans_tarifaires_id_fk" FOREIGN KEY ("plan_tarifaire_id") REFERENCES "public"."plans_tarifaires"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarifs" ADD CONSTRAINT "tarifs_plan_tarifaire_id_plans_tarifaires_id_fk" FOREIGN KEY ("plan_tarifaire_id") REFERENCES "public"."plans_tarifaires"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "restrictions_sejour_tenant_logement_date_base_uq" ON "restrictions_sejour" USING btree ("tenant_id","logement_id","date") WHERE "restrictions_sejour"."plan_tarifaire_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "restrictions_sejour_tenant_logement_plan_date_uq" ON "restrictions_sejour" USING btree ("tenant_id","logement_id","plan_tarifaire_id","date") WHERE "restrictions_sejour"."plan_tarifaire_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "tarifs_tenant_logement_date_base_uq" ON "tarifs" USING btree ("tenant_id","logement_id","date") WHERE "tarifs"."plan_tarifaire_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "tarifs_tenant_logement_plan_date_uq" ON "tarifs" USING btree ("tenant_id","logement_id","plan_tarifaire_id","date") WHERE "tarifs"."plan_tarifaire_id" is not null;--> statement-breakpoint
ALTER TABLE "plans_tarifaires" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY plans_tarifaires_isolation ON "plans_tarifaires"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "plans_tarifaires" TO lcd_app;
  END IF;
END $$;