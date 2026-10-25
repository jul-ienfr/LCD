ALTER TABLE "logement_proprietaires" ADD COLUMN "mode" text DEFAULT 'mandat_tiers' NOT NULL;--> statement-breakpoint
ALTER TABLE "logement_proprietaires" ADD COLUMN "statut" text DEFAULT 'actif' NOT NULL;--> statement-breakpoint
ALTER TABLE "logement_proprietaires" ADD COLUMN "date_debut" date;--> statement-breakpoint
ALTER TABLE "logement_proprietaires" ADD COLUMN "date_fin" date;--> statement-breakpoint
ALTER TABLE "logement_proprietaires" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "nature" text DEFAULT 'nom_propre' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "regime" text DEFAULT 'micro_bic_non_classe' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "tva" text DEFAULT 'non' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "siren" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "adresse" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "mentions_legales" text;