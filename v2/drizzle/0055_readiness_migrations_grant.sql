-- Readiness : le rôle applicatif doit lire le journal Drizzle pour comparer
-- le nombre de migrations appliquées. Aucune donnée métier n’est exposée.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    GRANT USAGE ON SCHEMA drizzle TO lcd_app;
    GRANT SELECT ON drizzle.__drizzle_migrations TO lcd_app;
  END IF;
END $$;
