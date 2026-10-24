-- RLS pour les incidents voyageur.
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY incidents_isolation ON incidents
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
