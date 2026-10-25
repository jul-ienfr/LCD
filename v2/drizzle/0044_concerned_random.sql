CREATE TABLE "formations_progressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"module_code" text NOT NULL,
	"etapes_faites" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "formations_progressions" ADD CONSTRAINT "formations_progressions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formations_progressions" ADD CONSTRAINT "formations_progressions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "formations_progressions_tenant_user_module_uq" ON "formations_progressions" USING btree ("tenant_id","user_id","module_code");--> statement-breakpoint
CREATE INDEX "formations_progressions_tenant_user_idx" ON "formations_progressions" USING btree ("tenant_id","user_id");
--> statement-breakpoint
ALTER TABLE "formations_progressions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "formations_progressions_isolation" ON "formations_progressions"
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "formations_progressions" TO lcd_app;
  END IF;
END $$;