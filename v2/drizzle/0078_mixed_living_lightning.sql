CREATE TABLE "tentatives_connexion" (
	"cle" text PRIMARY KEY NOT NULL,
	"echecs" integer DEFAULT 0 NOT NULL,
	"dernier_echec" timestamp with time zone DEFAULT now() NOT NULL,
	"bloque_jusqua" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "validations_sensibles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" text NOT NULL,
	"cible_id" text NOT NULL,
	"ref" text NOT NULL,
	"montant_centimes" integer DEFAULT 0 NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"demandeur_id" text NOT NULL,
	"demandeur_email" text NOT NULL,
	"statut" text DEFAULT 'en_attente' NOT NULL,
	"decideur_id" text,
	"decideur_email" text,
	"motif_decision" text,
	"decide_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "logements" ADD COLUMN "strategie_prix" text DEFAULT 'equilibre' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "ventes_suspendues" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "ventes_suspendues_motif" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "ventes_suspendues_le" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "rc_expire_le" date;--> statement-breakpoint
ALTER TABLE "validations_sensibles" ADD CONSTRAINT "validations_sensibles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tentatives_connexion_dernier_idx" ON "tentatives_connexion" USING btree ("dernier_echec");--> statement-breakpoint
CREATE UNIQUE INDEX "validations_sensibles_pending_uq" ON "validations_sensibles" USING btree ("tenant_id","type","cible_id") WHERE "validations_sensibles"."statut" = 'en_attente';--> statement-breakpoint
CREATE INDEX "validations_sensibles_tenant_statut_idx" ON "validations_sensibles" USING btree ("tenant_id","statut","created_at");