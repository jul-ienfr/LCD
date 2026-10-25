CREATE TABLE "blocages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"debut" text NOT NULL,
	"fin" text NOT NULL,
	"source" text DEFAULT 'import-ics' NOT NULL,
	"motif" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blocages" ADD CONSTRAINT "blocages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocages" ADD CONSTRAINT "blocages_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blocages_tenant_ref_uq" ON "blocages" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "blocages_tenant_logement_idx" ON "blocages" USING btree ("tenant_id","logement_id","debut","fin");