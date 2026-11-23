-- Spec 006, FR-031 — pointage terrain horodaté par le serveur.
-- Le serveur pose l'horodatage (`debut_reel`/`fin_reelle`) ; un pointage fait
-- hors ligne fournit son horodatage local, conservé dans les mêmes colonnes
-- avec `source = 'hors_ligne'`, et l'instant de réception serveur reste tracé
-- dans `*_recu_le` — la preuve que le pointage est arrivé après coup.
-- `duree_prevue_minutes` : durée prévue ; NULL = défaut du type (domaine).
ALTER TABLE "missions"
  ADD COLUMN IF NOT EXISTS "duree_prevue_minutes" integer;

ALTER TABLE "missions"
  ADD COLUMN IF NOT EXISTS "debut_reel" timestamptz;

ALTER TABLE "missions"
  ADD COLUMN IF NOT EXISTS "fin_reelle" timestamptz;

ALTER TABLE "missions"
  ADD COLUMN IF NOT EXISTS "debut_reel_source" text;

ALTER TABLE "missions"
  ADD COLUMN IF NOT EXISTS "fin_reelle_source" text;

ALTER TABLE "missions"
  ADD COLUMN IF NOT EXISTS "debut_reel_recu_le" timestamptz;

ALTER TABLE "missions"
  ADD COLUMN IF NOT EXISTS "fin_reelle_recu_le" timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'missions_duree_prevue_check'
  ) THEN
    ALTER TABLE "missions"
      ADD CONSTRAINT "missions_duree_prevue_check"
      CHECK (
        "duree_prevue_minutes" IS NULL
        OR ("duree_prevue_minutes" > 0 AND "duree_prevue_minutes" <= 1440)
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'missions_pointage_source_check'
  ) THEN
    ALTER TABLE "missions"
      ADD CONSTRAINT "missions_pointage_source_check"
      CHECK (
        ("debut_reel_source" IS NULL OR "debut_reel_source" IN ('serveur', 'hors_ligne'))
        AND ("fin_reelle_source" IS NULL OR "fin_reelle_source" IN ('serveur', 'hors_ligne'))
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'missions_pointage_ordre_check'
  ) THEN
    ALTER TABLE "missions"
      ADD CONSTRAINT "missions_pointage_ordre_check"
      CHECK (
        "fin_reelle" IS NULL
        OR ("debut_reel" IS NOT NULL AND "fin_reelle" >= "debut_reel")
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "missions_pointage_idx"
  ON "missions" ("tenant_id", "assigned_user_id", "debut_reel")
  WHERE "debut_reel" IS NOT NULL;
