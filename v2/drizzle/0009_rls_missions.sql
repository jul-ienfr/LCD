-- RLS pour les missions prestataire.
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY missions_isolation ON missions
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
