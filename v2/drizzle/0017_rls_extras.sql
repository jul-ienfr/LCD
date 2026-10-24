-- RLS pour les extras et commandes extras.
ALTER TABLE extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY extras_isolation ON extras
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY commandes_extras_isolation ON commandes_extras
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
