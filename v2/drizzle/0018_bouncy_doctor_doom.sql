CREATE TABLE "parametres_fiscaux" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"taux_tva_bp" integer DEFAULT 1000 NOT NULL,
	"taxe_sejour_nuit_personne_centimes" integer DEFAULT 0 NOT NULL,
	"taxe_sejour_plafond_centimes" integer,
	"prefixe_facture" text DEFAULT 'FAC' NOT NULL,
	"mentions_legales" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "parametres_fiscaux" ADD CONSTRAINT "parametres_fiscaux_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;