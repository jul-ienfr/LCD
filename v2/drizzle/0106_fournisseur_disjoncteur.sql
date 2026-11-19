-- Spec 006, US2 — disjoncteur fournisseur (FR-023).
-- Échecs consécutifs par affectation et horodatage de la pause automatique :
-- après N échecs, l'affectation est mise en pause (actif = false), une alerte
-- d'exploitation est ouverte et la reprise reste manuelle et tracée.
ALTER TABLE "logements_fournisseurs" ADD COLUMN IF NOT EXISTS "echecs_consecutifs" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "logements_fournisseurs" ADD COLUMN IF NOT EXISTS "disjoncteur_ouvert_le" timestamp with time zone;
