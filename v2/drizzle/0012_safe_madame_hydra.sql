CREATE TABLE "offres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"prospect_id" uuid NOT NULL,
	"logement_id" uuid,
	"titre" text NOT NULL,
	"montant_centimes" integer DEFAULT 0 NOT NULL,
	"statut" text DEFAULT 'brouillon' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nom" text NOT NULL,
	"email" text,
	"telephone" text,
	"source" text DEFAULT 'manuel' NOT NULL,
	"statut" text DEFAULT 'nouveau' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "offres" ADD CONSTRAINT "offres_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offres" ADD CONSTRAINT "offres_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offres" ADD CONSTRAINT "offres_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "offres_tenant_prospect_idx" ON "offres" USING btree ("tenant_id","prospect_id");--> statement-breakpoint
CREATE INDEX "offres_tenant_statut_idx" ON "offres" USING btree ("tenant_id","statut");--> statement-breakpoint
CREATE INDEX "prospects_tenant_statut_idx" ON "prospects" USING btree ("tenant_id","statut");--> statement-breakpoint
CREATE INDEX "prospects_tenant_email_idx" ON "prospects" USING btree ("tenant_id","email");