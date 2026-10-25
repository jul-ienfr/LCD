CREATE TABLE "flux_ics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"libelle" text NOT NULL,
	"url" text NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"derniere_sync" timestamp with time zone,
	"dernier_statut" text,
	"dernier_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flux_ics" ADD CONSTRAINT "flux_ics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flux_ics" ADD CONSTRAINT "flux_ics_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "flux_ics_tenant_logement_url_uq" ON "flux_ics" USING btree ("tenant_id","logement_id","url");--> statement-breakpoint
CREATE INDEX "flux_ics_tenant_logement_idx" ON "flux_ics" USING btree ("tenant_id","logement_id");