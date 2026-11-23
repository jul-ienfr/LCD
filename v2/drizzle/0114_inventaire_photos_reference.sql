-- Spec 006, FR-036 — inventaire photo de référence par pièce.
-- (1) Les photos de preuve d'intervention portent leur pièce : `photos_menage`
--     gagne `piece` (les photos existantes gardent `''`, non rattachées).
-- (2) `photos_reference` porte l'inventaire de référence d'un logement, une
--     ligne par photo et par pièce, avec sa légende. La contenance est bornée
--     par construction (4 photos par pièce, 15 pièces par logement), donc
--     aucune éviction n'est nécessaire.
ALTER TABLE "photos_menage"
  ADD COLUMN IF NOT EXISTS "piece" text NOT NULL DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'photos_menage_piece_check'
  ) THEN
    ALTER TABLE "photos_menage"
      ADD CONSTRAINT "photos_menage_piece_check"
      CHECK (length("piece") <= 60);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "photos_reference" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "logement_id" uuid NOT NULL REFERENCES "logements"("id") ON DELETE CASCADE,
  "piece" text NOT NULL,
  "ref" text NOT NULL,
  "chemin" text NOT NULL,
  "content_type" text NOT NULL,
  "taille_octets" integer NOT NULL,
  "legende" text NOT NULL DEFAULT '',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "photos_reference_piece_check"
    CHECK (length("piece") >= 1 AND length("piece") <= 60),
  CONSTRAINT "photos_reference_legende_check"
    CHECK (length("legende") <= 120),
  CONSTRAINT "photos_reference_taille_check"
    CHECK ("taille_octets" > 0 AND "taille_octets" <= 10485760)
);

CREATE UNIQUE INDEX IF NOT EXISTS "photos_reference_tenant_ref_uq"
  ON "photos_reference" ("tenant_id", "ref");

CREATE INDEX IF NOT EXISTS "photos_reference_tenant_logement_piece_idx"
  ON "photos_reference" ("tenant_id", "logement_id", "piece", "created_at");

ALTER TABLE "photos_reference" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'photos_reference'
      AND policyname = 'photos_reference_isolation'
  ) THEN
    CREATE POLICY photos_reference_isolation
      ON "photos_reference"
      USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
      WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, DELETE ON "photos_reference" TO lcd_app;
  END IF;
END $$;
