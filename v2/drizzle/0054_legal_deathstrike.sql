CREATE TABLE "assistant_consommations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"modele" text NOT NULL,
	"cout_centimes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assistant_consommations" ADD CONSTRAINT "assistant_consommations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_consommations" ADD CONSTRAINT "assistant_consommations_message_id_messages_voyageur_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages_voyageur"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assistant_consommations_message_uq" ON "assistant_consommations" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "assistant_consommations_tenant_date_idx" ON "assistant_consommations" USING btree ("tenant_id","created_at");
--> statement-breakpoint
ALTER TABLE "assistant_consommations" ADD CONSTRAINT "assistant_consommations_cout_check" CHECK ("cout_centimes" >= 0);
--> statement-breakpoint
ALTER TABLE "assistant_consommations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "assistant_consommations_isolation" ON "assistant_consommations"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "assistant_consommations" TO lcd_app;
  END IF;
END $$;