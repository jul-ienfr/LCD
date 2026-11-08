ALTER TABLE "reservations" ADD COLUMN "flux_ics_id" uuid;--> statement-breakpoint
ALTER TABLE "blocages" ADD COLUMN "flux_ics_id" uuid;--> statement-breakpoint
ALTER TABLE "flux_ics" ADD COLUMN "intervalle_minutes" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "flux_ics" ADD COLUMN "derniere_tentative" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "flux_ics" ADD COLUMN "prochain_essai" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "flux_ics" ADD COLUMN "echecs_consecutifs" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "flux_ics" ADD COLUMN "vides_consecutifs" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "flux_ics" ADD COLUMN "etag" text;--> statement-breakpoint
ALTER TABLE "flux_ics" ADD COLUMN "derniere_modification" text;--> statement-breakpoint
ALTER TABLE "flux_ics" ADD COLUMN "empreinte" text;--> statement-breakpoint
CREATE INDEX "reservations_flux_ics_idx" ON "reservations" USING btree ("flux_ics_id");--> statement-breakpoint
CREATE INDEX "blocages_flux_ics_idx" ON "blocages" USING btree ("flux_ics_id");--> statement-breakpoint
CREATE INDEX "flux_ics_prochain_essai_idx" ON "flux_ics" USING btree ("actif","prochain_essai");--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_flux_ics_id_flux_ics_id_fk" FOREIGN KEY ("flux_ics_id") REFERENCES "public"."flux_ics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocages" ADD CONSTRAINT "blocages_flux_ics_id_flux_ics_id_fk" FOREIGN KEY ("flux_ics_id") REFERENCES "public"."flux_ics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "ics_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"flux_ics_id" uuid NOT NULL,
	"debut" timestamp with time zone DEFAULT now() NOT NULL,
	"fin" timestamp with time zone,
	"statut" text NOT NULL,
	"statut_http" integer,
	"duree_ms" integer,
	"evenements" integer DEFAULT 0 NOT NULL,
	"crees" integer DEFAULT 0 NOT NULL,
	"mis_a_jour" integer DEFAULT 0 NOT NULL,
	"annules" integer DEFAULT 0 NOT NULL,
	"deja" integer DEFAULT 0 NOT NULL,
	"conflits" integer DEFAULT 0 NOT NULL,
	"ignores" integer DEFAULT 0 NOT NULL,
	"message" text,
	"details" jsonb
);--> statement-breakpoint
ALTER TABLE "ics_sync_runs" ADD CONSTRAINT "ics_sync_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ics_sync_runs" ADD CONSTRAINT "ics_sync_runs_flux_ics_id_flux_ics_id_fk" FOREIGN KEY ("flux_ics_id") REFERENCES "public"."flux_ics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ics_sync_runs_flux_idx" ON "ics_sync_runs" USING btree ("flux_ics_id","debut");--> statement-breakpoint
CREATE INDEX "ics_sync_runs_tenant_idx" ON "ics_sync_runs" USING btree ("tenant_id","debut");--> statement-breakpoint
CREATE TABLE "verrous_systeme" (
	"nom" text PRIMARY KEY NOT NULL,
	"titulaire" text NOT NULL,
	"expire_le" timestamp with time zone NOT NULL
);--> statement-breakpoint
ALTER TABLE "ics_sync_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY ics_sync_runs_isolation ON "ics_sync_runs"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "ics_sync_runs" TO lcd_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "verrous_systeme" TO lcd_app;
  END IF;
END $$;
