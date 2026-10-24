CREATE TABLE "tarifs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logement_id" uuid NOT NULL,
	"date" date NOT NULL,
	"prix_centimes" integer NOT NULL,
	"source" text DEFAULT 'manuel' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "client_nom" text;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "voyageurs" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "source" text DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE "tarifs" ADD CONSTRAINT "tarifs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarifs" ADD CONSTRAINT "tarifs_logement_id_logements_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tarifs_tenant_logement_date_uq" ON "tarifs" USING btree ("tenant_id","logement_id","date");--> statement-breakpoint
CREATE INDEX "tarifs_tenant_date_idx" ON "tarifs" USING btree ("tenant_id","date");