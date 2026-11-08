-- Rétention des historiques de synchronisation ICS (30 jours par défaut).
CREATE OR REPLACE FUNCTION public.purger_ics_sync_runs(
  p_jours integer DEFAULT 30
)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH supprimes AS (
    DELETE FROM public.ics_sync_runs
    WHERE debut < now() - make_interval(
      days => GREATEST(1, LEAST(coalesce(p_jours, 30), 365))
    )
    RETURNING 1
  )
  SELECT count(*)::int FROM supprimes;
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.purger_ics_sync_runs(integer) FROM PUBLIC;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT EXECUTE ON FUNCTION public.purger_ics_sync_runs(integer) TO lcd_app;
  END IF;
END $$;
