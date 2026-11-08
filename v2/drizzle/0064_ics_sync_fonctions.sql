-- Découverte cross-tenant pour le planificateur ICS. SECURITY DEFINER permet
-- au rôle applicatif (RLS) de lire les flux de tous les tenants sans exposer
-- une connexion owner au runtime.
CREATE OR REPLACE FUNCTION public.lister_flux_ics_a_synchroniser(
  p_limite integer,
  p_force boolean
)
RETURNS SETOF public.flux_ics
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT *
  FROM public.flux_ics
  WHERE actif
    AND (
      p_force
      OR prochain_essai IS NULL
      OR prochain_essai <= now()
    )
  ORDER BY
    CASE WHEN p_force THEN NULL ELSE prochain_essai END ASC NULLS FIRST,
    derniere_tentative ASC NULLS FIRST,
    tenant_id,
    libelle
  LIMIT GREATEST(1, LEAST(coalesce(p_limite, 100), 1000));
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.lister_flux_ics_a_synchroniser(integer, boolean) FROM PUBLIC;--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.resume_ics_sync(
  p_tolerance_minutes integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'actifs', (SELECT count(*) FROM public.flux_ics WHERE actif),
    'enErreur', (
      SELECT count(*) FROM public.flux_ics
      WHERE actif AND dernier_statut = 'erreur'
    ),
    'enRetard', (
      SELECT count(*) FROM public.flux_ics
      WHERE actif
        AND coalesce(derniere_tentative, created_at) <
          now() - (
            (intervalle_minutes + GREATEST(0, coalesce(p_tolerance_minutes, 10)))
            * interval '1 minute'
          )
    ),
    'jamaisSync', (
      SELECT count(*) FROM public.flux_ics
      WHERE actif AND derniere_sync IS NULL
    ),
    'conflits24h', (
      SELECT coalesce(sum(conflits), 0)::int
      FROM public.ics_sync_runs
      WHERE debut > now() - interval '24 hours'
    ),
    'dernierCycle', (SELECT max(debut) FROM public.ics_sync_runs)
  );
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.resume_ics_sync(integer) FROM PUBLIC;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT EXECUTE ON FUNCTION public.lister_flux_ics_a_synchroniser(integer, boolean) TO lcd_app;
    GRANT EXECUTE ON FUNCTION public.resume_ics_sync(integer) TO lcd_app;
  END IF;
END $$;
