-- RLS pour les cautions / dépôts de garantie.
ALTER TABLE cautions ENABLE ROW LEVEL SECURITY;

CREATE POLICY cautions_isolation ON cautions
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
