-- FR-037 : visibilité des preuves côté propriétaire.
--
-- Chaque mandat porte ce que son propriétaire voit des interventions du
-- logement : `masquee` (rien), `resume` (date, type et état de la preuve) ou
-- `complete` (détail du pointage, motif de refus et photos). Les mandats
-- existants partent sur `resume`, le niveau par défaut du domaine.

ALTER TABLE "logement_proprietaires"
  ADD COLUMN IF NOT EXISTS "visibilite_preuves" text NOT NULL DEFAULT 'resume';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'logement_proprietaires_visibilite_check'
  ) THEN
    ALTER TABLE "logement_proprietaires"
      ADD CONSTRAINT "logement_proprietaires_visibilite_check"
      CHECK ("visibilite_preuves" IN ('masquee', 'resume', 'complete'));
  END IF;
END $$;
