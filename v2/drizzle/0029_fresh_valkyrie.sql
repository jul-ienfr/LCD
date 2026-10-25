CREATE TABLE "cautions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"montant_centimes" integer NOT NULL,
	"statut" text DEFAULT 'attendue' NOT NULL,
	"date_reception" date,
	"date_restitution" date,
	"montant_retenu_centimes" integer DEFAULT 0 NOT NULL,
	"motif_retenue" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cautions" ADD CONSTRAINT "cautions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cautions" ADD CONSTRAINT "cautions_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cautions_tenant_reservation_uq" ON "cautions" USING btree ("tenant_id","reservation_id");--> statement-breakpoint
CREATE INDEX "cautions_tenant_statut_idx" ON "cautions" USING btree ("tenant_id","statut");