CREATE TABLE "entretiens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"date" date NOT NULL,
	"type" text DEFAULT 'entretien' NOT NULL,
	"titre" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"prestataire" text,
	"cout_centimes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entretiens" ADD CONSTRAINT "entretiens_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entretiens" ADD CONSTRAINT "entretiens_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "entretiens_tenant_ref_uq" ON "entretiens" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "entretiens_tenant_logement_idx" ON "entretiens" USING btree ("tenant_id","logement_id","date");
--> statement-breakpoint
ALTER TABLE "entretiens" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "entretiens_isolation" ON "entretiens"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "entretiens" TO lcd_app;
  END IF;
END $$;