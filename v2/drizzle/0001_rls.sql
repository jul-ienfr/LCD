-- RLS multi-tenant (défense en profondeur) — tables métier uniquement.
--
-- Les tables Better Auth (session, account, verification, two_factor) et
-- `users` ne sont PAS sous RLS : la connexion doit pouvoir retrouver un
-- utilisateur par email avant de connaître son tenant. Le contrôle d'accès
-- applicatif (session + role + tenant) reste la première barrière.
--
-- Le rôle applicatif de production doit être DISTINCT du propriétaire des
-- tables ; sinon PostgreSQL bypasse les policies. En local, le rôle `lcd`
-- est propriétaire : les policies sont présentes mais non forcées.
--
-- `withTenant()` positionne app.tenant_id dans la transaction :
--   select set_config('app.tenant_id', '<uuid>', true);

ALTER TABLE logements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY logements_isolation ON logements
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY reservations_isolation ON reservations
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY audit_logs_isolation ON audit_logs
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY idempotency_keys_isolation ON idempotency_keys
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
