-- RLS pour les tarifs journaliers (même modèle que les autres tables métier).
ALTER TABLE tarifs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tarifs_isolation ON tarifs
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
