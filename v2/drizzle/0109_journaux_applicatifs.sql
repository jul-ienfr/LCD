-- Spec 006, FR-016 — journaux applicatifs consultables depuis la supervision.
-- Les lignes structurées de `logInfo`/`logErreur` (stdout) sont aussi
-- persistées ici, bornées : la supervision les lit sans SSH. Table plateforme
-- (aucun tenant_id) : un incident d'exploitation est global. Aucune donnée
-- sensible ne doit y être écrite : `src/lib/server/journaux.ts` masque les
-- clés sensibles avant insertion (même liste que Sentry).
CREATE TABLE IF NOT EXISTS "journaux_applicatifs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"niveau" text NOT NULL DEFAULT 'info',
	"message" text NOT NULL,
	"contexte" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journaux_applicatifs" ADD CONSTRAINT "journaux_applicatifs_niveau_valide" CHECK ("niveau" IN ('info', 'error'));--> statement-breakpoint
ALTER TABLE "journaux_applicatifs" ADD CONSTRAINT "journaux_applicatifs_contexte_objet" CHECK (jsonb_typeof("contexte") = 'object');--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "journaux_applicatifs_created_at_idx" ON "journaux_applicatifs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "journaux_applicatifs_niveau_idx" ON "journaux_applicatifs" USING btree ("niveau","created_at");--> statement-breakpoint

-- Le rôle applicatif écrit et lit le journal (insertion best-effort depuis le
-- logger, lecture par la page de supervision). La suppression normale passe
-- par la purge bornée ci-dessous.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT SELECT, INSERT ON "journaux_applicatifs" TO lcd_app;
  END IF;
END $$;--> statement-breakpoint

-- Rétention : purge au-delà de la durée déclarée (FR-015/FR-016). Bornée :
-- jamais moins de 7 jours, même si l'appelant demande moins.
CREATE OR REPLACE FUNCTION purger_journaux_applicatifs(p_retention_jours integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  supprimees integer;
BEGIN
  DELETE FROM journaux_applicatifs
  WHERE created_at < now() - make_interval(days => greatest(p_retention_jours, 7));
  GET DIAGNOSTICS supprimees = ROW_COUNT;
  RETURN supprimees;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION purger_journaux_applicatifs(integer) FROM public;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT EXECUTE ON FUNCTION purger_journaux_applicatifs(integer) TO lcd_app;
  END IF;
END $$;
