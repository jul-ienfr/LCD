-- RLS pour les paiements.
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;

CREATE POLICY paiements_isolation ON paiements
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
