CREATE TABLE "memoire_voyageurs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email_hash" text NOT NULL,
	"nom" text NOT NULL,
	"preferences" text DEFAULT '' NOT NULL,
	"consentement_at" timestamp with time zone NOT NULL,
	"expire_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memoire_voyageurs" ADD CONSTRAINT "memoire_voyageurs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "memoire_voyageurs_tenant_email_uq" ON "memoire_voyageurs" USING btree ("tenant_id","email_hash");--> statement-breakpoint
CREATE INDEX "memoire_voyageurs_expire_idx" ON "memoire_voyageurs" USING btree ("expire_at");
--> statement-breakpoint
ALTER TABLE "memoire_voyageurs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "memoire_voyageurs_isolation" ON "memoire_voyageurs"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "memoire_voyageurs" TO lcd_app;
  END IF;
END $$;
