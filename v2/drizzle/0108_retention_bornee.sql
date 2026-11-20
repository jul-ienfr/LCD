-- Spec 006, FR-015 — rétention bornée et purges planifiées.
-- Une fonction de purge bornée par famille de traces. SECURITY DEFINER :
-- ces tables sont sous RLS (audit_logs, evenements_canal, webhook_deliveries,
-- executions_automatisation) et le rôle applicatif ne doit pouvoir supprimer
-- que ce que la rétention couvre. Chaque fonction est idempotente : la
-- relancer ne supprime rien de plus.

-- La purge filtre sur la seule date : les index existants commencent tous par
-- tenant_id et ne peuvent pas servir. La purge tourne à chaque contrôle des
-- tâches (30 min) — un index dédié garde le coût constant quand les tables
-- grossissent.
CREATE INDEX IF NOT EXISTS "audit_logs_date_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "evenements_canal_date_idx" ON "evenements_canal" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_deliveries_date_idx" ON "webhook_deliveries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "executions_automatisation_date_idx" ON "executions_automatisation" USING btree ("created_at");--> statement-breakpoint

-- Journal d'audit : jamais moins de 365 jours, quel que soit l'appelant.
CREATE OR REPLACE FUNCTION purger_audit_logs(p_retention_jours integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  supprimees integer;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < now() - make_interval(days => greatest(p_retention_jours, 365));
  GET DIAGNOSTICS supprimees = ROW_COUNT;
  RETURN supprimees;
END;
$$;
--> statement-breakpoint

-- Événements canal : un événement en erreur attend une décision humaine.
CREATE OR REPLACE FUNCTION purger_evenements_canal(p_retention_jours integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  supprimees integer;
BEGIN
  DELETE FROM evenements_canal
  WHERE created_at < now() - make_interval(days => p_retention_jours)
    AND statut <> 'erreur';
  GET DIAGNOSTICS supprimees = ROW_COUNT;
  RETURN supprimees;
END;
$$;
--> statement-breakpoint

-- Livraisons webhook : jamais une livraison en attente (file vivante).
CREATE OR REPLACE FUNCTION purger_livraisons_webhook(p_retention_jours integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  supprimees integer;
BEGIN
  DELETE FROM webhook_deliveries
  WHERE created_at < now() - make_interval(days => p_retention_jours)
    AND statut <> 'pending';
  GET DIAGNOSTICS supprimees = ROW_COUNT;
  RETURN supprimees;
END;
$$;
--> statement-breakpoint

-- Exécutions d'automatisation : pures traces (le message vit dans
-- messages_voyageur), purge complète au-delà de la rétention.
CREATE OR REPLACE FUNCTION purger_executions_automatisation(p_retention_jours integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  supprimees integer;
BEGIN
  DELETE FROM executions_automatisation
  WHERE created_at < now() - make_interval(days => p_retention_jours);
  GET DIAGNOSTICS supprimees = ROW_COUNT;
  RETURN supprimees;
END;
$$;
--> statement-breakpoint

-- Tentatives de connexion : jamais un blocage encore actif.
CREATE OR REPLACE FUNCTION purger_tentatives_connexion(p_retention_jours integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  supprimees integer;
BEGIN
  DELETE FROM tentatives_connexion
  WHERE dernier_echec < now() - make_interval(days => p_retention_jours)
    AND (bloque_jusqua IS NULL OR bloque_jusqua < now());
  GET DIAGNOSTICS supprimees = ROW_COUNT;
  RETURN supprimees;
END;
$$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION purger_audit_logs(integer) FROM public;--> statement-breakpoint
REVOKE ALL ON FUNCTION purger_evenements_canal(integer) FROM public;--> statement-breakpoint
REVOKE ALL ON FUNCTION purger_livraisons_webhook(integer) FROM public;--> statement-breakpoint
REVOKE ALL ON FUNCTION purger_executions_automatisation(integer) FROM public;--> statement-breakpoint
REVOKE ALL ON FUNCTION purger_tentatives_connexion(integer) FROM public;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT EXECUTE ON FUNCTION purger_audit_logs(integer) TO lcd_app;
    GRANT EXECUTE ON FUNCTION purger_evenements_canal(integer) TO lcd_app;
    GRANT EXECUTE ON FUNCTION purger_livraisons_webhook(integer) TO lcd_app;
    GRANT EXECUTE ON FUNCTION purger_executions_automatisation(integer) TO lcd_app;
    GRANT EXECUTE ON FUNCTION purger_tentatives_connexion(integer) TO lcd_app;
  END IF;
END $$;
