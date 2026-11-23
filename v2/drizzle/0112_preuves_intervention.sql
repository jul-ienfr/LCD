-- Spec 006, FR-032 — cycle de preuve d'intervention (soumise → validée ou
-- refusée avec motif obligatoire → reprise).
-- L'état courant vit sur la mission ; l'historique des passages vit dans
-- `preuves_intervention_transitions` (une ligne par passage, jamais modifiée).
ALTER TABLE "missions"
  ADD COLUMN IF NOT EXISTS "preuve_statut" text NOT NULL DEFAULT 'a_soumettre';

ALTER TABLE "missions"
  ADD COLUMN IF NOT EXISTS "preuve_motif_refus" text;

ALTER TABLE "missions"
  ADD COLUMN IF NOT EXISTS "preuve_soumise_le" timestamptz;

ALTER TABLE "missions"
  ADD COLUMN IF NOT EXISTS "preuve_validee_le" timestamptz;

ALTER TABLE "missions"
  ADD COLUMN IF NOT EXISTS "preuve_validee_par" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'missions_preuve_statut_check'
  ) THEN
    ALTER TABLE "missions"
      ADD CONSTRAINT "missions_preuve_statut_check"
      CHECK ("preuve_statut" IN ('a_soumettre', 'soumise', 'validee', 'refusee'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'missions_preuve_soumission_check'
  ) THEN
    ALTER TABLE "missions"
      ADD CONSTRAINT "missions_preuve_soumission_check"
      CHECK ("preuve_statut" = 'a_soumettre' OR "preuve_soumise_le" IS NOT NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'missions_preuve_refus_check'
  ) THEN
    ALTER TABLE "missions"
      ADD CONSTRAINT "missions_preuve_refus_check"
      CHECK (
        "preuve_statut" <> 'refusee'
        OR ("preuve_motif_refus" IS NOT NULL AND length("preuve_motif_refus") >= 10)
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'missions_preuve_validation_check'
  ) THEN
    ALTER TABLE "missions"
      ADD CONSTRAINT "missions_preuve_validation_check"
      CHECK (
        "preuve_statut" <> 'validee'
        OR ("preuve_validee_le" IS NOT NULL AND "preuve_validee_par" IS NOT NULL)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "missions_preuve_statut_idx"
  ON "missions" ("tenant_id", "preuve_statut");

CREATE TABLE IF NOT EXISTS "preuves_intervention_transitions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "mission_id" uuid NOT NULL REFERENCES "missions"("id") ON DELETE CASCADE,
  "de" text,
  "vers" text NOT NULL,
  "motif" text,
  "qui" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "preuves_transitions_vers_check" CHECK (
    "vers" IN ('soumise', 'validee', 'refusee')
  ),
  CONSTRAINT "preuves_transitions_de_check" CHECK (
    "de" IS NULL OR "de" IN ('a_soumettre', 'soumise', 'validee', 'refusee')
  ),
  CONSTRAINT "preuves_transitions_motif_check" CHECK (
    "vers" <> 'refusee'
    OR ("motif" IS NOT NULL AND length("motif") >= 10)
  )
);

CREATE INDEX IF NOT EXISTS "preuves_transitions_mission_idx"
  ON "preuves_intervention_transitions" ("tenant_id", "mission_id", "created_at");

ALTER TABLE "preuves_intervention_transitions" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'preuves_intervention_transitions'
      AND policyname = 'preuves_transitions_isolation'
  ) THEN
    CREATE POLICY preuves_transitions_isolation
      ON "preuves_intervention_transitions"
      USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
      WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, DELETE ON "preuves_intervention_transitions" TO lcd_app;
  END IF;
END $$;
