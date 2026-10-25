CREATE TABLE "phrases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid,
	"ref" text NOT NULL,
	"categorie" text DEFAULT 'general' NOT NULL,
	"titre" text NOT NULL,
	"contenu" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "phrases" ADD CONSTRAINT "phrases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phrases" ADD CONSTRAINT "phrases_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "phrases_tenant_ref_uq" ON "phrases" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "phrases_tenant_logement_idx" ON "phrases" USING btree ("tenant_id","logement_id");
--> statement-breakpoint
ALTER TABLE "phrases" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "phrases_isolation" ON "phrases"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "phrases" TO lcd_app;
  END IF;
END $$;