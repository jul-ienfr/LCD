-- RLS pour les rattachements propriétaire ↔ logement.
ALTER TABLE logement_proprietaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY logement_proprietaires_isolation ON logement_proprietaires
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
