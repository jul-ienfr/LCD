CREATE TABLE "dispatches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"prestataire_id" text NOT NULL,
	"ref" text NOT NULL,
	"statut" text DEFAULT 'proposee' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"repondu_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_prestataire_id_users_id_fk" FOREIGN KEY ("prestataire_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dispatches_tenant_ref_uq" ON "dispatches" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "dispatches_tenant_mission_idx" ON "dispatches" USING btree ("tenant_id","mission_id");--> statement-breakpoint
CREATE INDEX "dispatches_tenant_presta_idx" ON "dispatches" USING btree ("tenant_id","prestataire_id","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "dispatches_mission_active_uq" ON "dispatches" ("tenant_id","mission_id") WHERE statut IN ('proposee','acceptee');
--> statement-breakpoint
ALTER TABLE "dispatches" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "dispatches_isolation" ON "dispatches"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "dispatches" TO lcd_app;
  END IF;
END $$;