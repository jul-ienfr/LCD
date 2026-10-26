ALTER TABLE "logements" ADD COLUMN "publication" text DEFAULT 'brouillon' NOT NULL;--> statement-breakpoint
UPDATE "logements" SET "publication" = 'publiee' WHERE "statut" = 'actif' AND "copro_verifiee" = true;
