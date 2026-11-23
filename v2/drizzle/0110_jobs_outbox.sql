-- Spec 006, FR-025 — file de jobs durable (outbox).
-- Table plateforme (aucun tenant_id) : un job porte son tenant dans `payload`.
-- Écriture avant exécution : un redémarrage ne perd pas une action acceptée.
-- Réclamation à bail (`verrouille_jusqua`) : un worker mort libère sa place.
CREATE TABLE IF NOT EXISTS "jobs_outbox" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nom" text NOT NULL,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "cle_idempotence" text,
  "statut" text NOT NULL DEFAULT 'en_attente',
  "tentatives" integer NOT NULL DEFAULT 0,
  "tentatives_max" integer NOT NULL DEFAULT 5,
  "disponible_a" timestamptz NOT NULL DEFAULT now(),
  "verrouille_jusqua" timestamptz,
  "derniere_erreur" text,
  "termine_le" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "jobs_outbox_statut_check" CHECK (
    "statut" IN ('en_attente', 'en_cours', 'reussi', 'echec')
  ),
  CONSTRAINT "jobs_outbox_tentatives_check" CHECK (
    "tentatives" >= 0 AND "tentatives_max" >= 1
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS "jobs_outbox_cle_idempotence_uq"
  ON "jobs_outbox" ("cle_idempotence");

CREATE INDEX IF NOT EXISTS "jobs_outbox_statut_disponible_idx"
  ON "jobs_outbox" ("statut", "disponible_a");

CREATE INDEX IF NOT EXISTS "jobs_outbox_nom_idx"
  ON "jobs_outbox" ("nom");

-- Fonction de purge bornée (SECURITY DEFINER) : seules les lignes terminales
-- (`reussi` / `echec`) anciennes sont retirées ; les jobs en cours d'attente
-- ou d'exécution ne sont jamais purgés.
CREATE OR REPLACE FUNCTION purger_jobs_outbox(p_retention_jours integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supprimees integer;
BEGIN
  IF p_retention_jours IS NULL OR p_retention_jours < 1 THEN
    RAISE EXCEPTION 'retention_jours doit être >= 1';
  END IF;
  DELETE FROM "jobs_outbox"
  WHERE "statut" IN ('reussi', 'echec')
    AND "updated_at" < now() - (p_retention_jours || ' days')::interval;
  GET DIAGNOSTICS supprimees = ROW_COUNT;
  RETURN supprimees;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "jobs_outbox" TO lcd_app;
    GRANT EXECUTE ON FUNCTION purger_jobs_outbox(integer) TO lcd_app;
  END IF;
END $$;