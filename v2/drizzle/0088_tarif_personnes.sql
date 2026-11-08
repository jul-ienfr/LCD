ALTER TABLE "tarifs" ADD COLUMN "personnes_incluses" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "tarifs" ADD COLUMN "prix_par_personne_centimes" integer;--> statement-breakpoint
ALTER TABLE "tarifs" ADD CONSTRAINT "tarifs_prix_par_personne_positif" CHECK ("prix_par_personne_centimes" IS NULL OR "prix_par_personne_centimes" >= 0);--> statement-breakpoint
ALTER TABLE "tarifs" ADD CONSTRAINT "tarifs_personnes_incluses_positif" CHECK ("personnes_incluses" >= 0);
