-- Le registre des fournisseurs est une table plateforme : le rôle applicatif
-- ne doit pouvoir que lire l'état activé. Les écritures passent par la
-- connexion owner du super-admin.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lcd_app') THEN
    REVOKE INSERT, UPDATE, DELETE ON "fournisseurs_canaux" FROM lcd_app;
    GRANT SELECT ON "fournisseurs_canaux" TO lcd_app;
  END IF;
END $$;
