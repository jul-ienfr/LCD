CREATE TABLE "paiements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"facture_id" uuid NOT NULL,
	"ref" text NOT NULL,
	"montant_centimes" integer NOT NULL,
	"mode" text DEFAULT 'virement' NOT NULL,
	"date_paiement" date NOT NULL,
	"reference" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_facture_id_factures_id_fk" FOREIGN KEY ("facture_id") REFERENCES "public"."factures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "paiements_tenant_ref_uq" ON "paiements" USING btree ("tenant_id","ref");--> statement-breakpoint
CREATE INDEX "paiements_tenant_facture_idx" ON "paiements" USING btree ("tenant_id","facture_id","date_paiement");--> statement-breakpoint
CREATE INDEX "paiements_tenant_date_idx" ON "paiements" USING btree ("tenant_id","date_paiement");