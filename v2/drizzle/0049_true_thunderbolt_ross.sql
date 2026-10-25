CREATE TABLE "sinistres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"type" text NOT NULL,
	"date" date NOT NULL,
	"description" text NOT NULL,
	"montant_estime_centimes" integer DEFAULT 0 NOT NULL,
	"franchise_centimes" integer DEFAULT 0 NOT NULL,
	"statut" text DEFAULT 'declare' NOT NULL,
	"montant_indemnise_centimes" integer,
	"numero_declaration" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sinistres" ADD CONSTRAINT "sinistres_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sinistres" ADD CONSTRAINT "sinistres_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sinistres_tenant_ref_uq" ON "sinistres" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "sinistres_tenant_logement_date_idx" ON "sinistres" USING btree ("tenant_id","logement_id","date");
--> statement-breakpoint
ALTER TABLE "sinistres" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "sinistres_isolation" ON "sinistres"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "sinistres" TO lcd_app;
  END IF;
END $$;