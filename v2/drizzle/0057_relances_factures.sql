CREATE TABLE "relances_factures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"facture_id" uuid NOT NULL,
	"jour" date NOT NULL,
	"destinataire" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "relances_factures" ADD CONSTRAINT "relances_factures_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relances_factures" ADD CONSTRAINT "relances_factures_facture_id_factures_id_fk" FOREIGN KEY ("facture_id") REFERENCES "public"."factures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "relances_factures_tenant_facture_jour_uq" ON "relances_factures" USING btree ("tenant_id","facture_id","jour");--> statement-breakpoint
CREATE INDEX "relances_factures_tenant_jour_idx" ON "relances_factures" USING btree ("tenant_id","jour");
--> statement-breakpoint
ALTER TABLE "relances_factures" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "relances_factures_isolation" ON "relances_factures"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "relances_factures" TO lcd_app;
  END IF;
END $$;
