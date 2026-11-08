CREATE TABLE "demandes_sync" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"tentatives" integer DEFAULT 0 NOT NULL,
	"disponible_a" timestamp with time zone DEFAULT now() NOT NULL,
	"derniere_erreur" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "demandes_sync" ADD CONSTRAINT "demandes_sync_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demandes_sync" ADD CONSTRAINT "demandes_sync_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "demandes_sync_tenant_logement_uq" ON "demandes_sync" USING btree ("tenant_id","logement_id");--> statement-breakpoint
CREATE INDEX "demandes_sync_disponible_idx" ON "demandes_sync" USING btree ("disponible_a");--> statement-breakpoint
CREATE INDEX "demandes_sync_tenant_idx" ON "demandes_sync" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "demandes_sync" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY demandes_sync_isolation ON "demandes_sync"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "demandes_sync" TO lcd_app;
  END IF;
END $$;