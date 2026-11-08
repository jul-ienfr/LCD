CREATE TABLE "fils_internes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid,
	"canal" text NOT NULL,
	"sujet" text NOT NULL,
	"statut" text DEFAULT 'ouvert' NOT NULL,
	"cree_par" text NOT NULL,
	"dernier_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages_fils_internes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"fil_id" uuid NOT NULL,
	"auteur_email" text NOT NULL,
	"auteur_role" text NOT NULL,
	"corps" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fils_internes" ADD CONSTRAINT "fils_internes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fils_internes" ADD CONSTRAINT "fils_internes_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages_fils_internes" ADD CONSTRAINT "messages_fils_internes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages_fils_internes" ADD CONSTRAINT "messages_fils_internes_fil_id_fils_internes_id_fk" FOREIGN KEY ("fil_id") REFERENCES "public"."fils_internes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fils_internes_tenant_canal_idx" ON "fils_internes" USING btree ("tenant_id","canal","dernier_message_at");--> statement-breakpoint
CREATE INDEX "fils_internes_tenant_logement_idx" ON "fils_internes" USING btree ("tenant_id","logement_id");--> statement-breakpoint
CREATE INDEX "messages_fils_internes_tenant_fil_idx" ON "messages_fils_internes" USING btree ("tenant_id","fil_id","created_at");--> statement-breakpoint
ALTER TABLE "fils_internes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY fils_internes_isolation ON "fils_internes"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
ALTER TABLE "messages_fils_internes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY messages_fils_internes_isolation ON "messages_fils_internes"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "fils_internes" TO lcd_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "messages_fils_internes" TO lcd_app;
  END IF;
END $$;