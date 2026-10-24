CREATE TABLE "logement_proprietaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "logement_proprietaires" ADD CONSTRAINT "logement_proprietaires_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logement_proprietaires" ADD CONSTRAINT "logement_proprietaires_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logement_proprietaires" ADD CONSTRAINT "logement_proprietaires_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "logement_proprietaires_uq" ON "logement_proprietaires" USING btree ("tenant_id","logement_id","user_id");--> statement-breakpoint
CREATE INDEX "logement_proprietaires_user_idx" ON "logement_proprietaires" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "logement_proprietaires_logement_idx" ON "logement_proprietaires" USING btree ("tenant_id","logement_id");