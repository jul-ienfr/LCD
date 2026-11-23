-- Spec 006, FR-035 — checklists structurées par pièce, référentiel par logement.
-- `menage_taches.piece` porte la pièce de chaque ligne cochée ; les lignes
-- existantes gardent `''` (regroupées sous « Général ») puisque leur checklist
-- n'était pas découpée. Le référentiel d'un logement est la liste de ses pièces
-- et des tâches de chacune, remplacé en bloc à chaque enregistrement.
ALTER TABLE "menage_taches"
  ADD COLUMN IF NOT EXISTS "piece" text NOT NULL DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'menage_taches_piece_check'
  ) THEN
    ALTER TABLE "menage_taches"
      ADD CONSTRAINT "menage_taches_piece_check"
      CHECK (length("piece") <= 60);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "menage_referentiels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "logement_id" uuid NOT NULL REFERENCES "logements"("id") ON DELETE CASCADE,
  "piece" text NOT NULL,
  "piece_ordre" integer NOT NULL DEFAULT 0,
  "libelle" text NOT NULL,
  "ordre" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "menage_referentiels_piece_check"
    CHECK (length("piece") >= 1 AND length("piece") <= 60),
  CONSTRAINT "menage_referentiels_libelle_check"
    CHECK (length("libelle") >= 2 AND length("libelle") <= 120),
  CONSTRAINT "menage_referentiels_ordres_check"
    CHECK (
      "piece_ordre" >= 0 AND "piece_ordre" < 15
      AND "ordre" >= 0 AND "ordre" < 20
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS "menage_referentiels_tenant_logement_piece_libelle_uq"
  ON "menage_referentiels" ("tenant_id", "logement_id", "piece", "libelle");

CREATE INDEX IF NOT EXISTS "menage_referentiels_tenant_logement_idx"
  ON "menage_referentiels" ("tenant_id", "logement_id", "piece_ordre", "ordre");

ALTER TABLE "menage_referentiels" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'menage_referentiels'
      AND policyname = 'menage_referentiels_isolation'
  ) THEN
    CREATE POLICY menage_referentiels_isolation
      ON "menage_referentiels"
      USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
      WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, DELETE ON "menage_referentiels" TO lcd_app;
  END IF;
END $$;
