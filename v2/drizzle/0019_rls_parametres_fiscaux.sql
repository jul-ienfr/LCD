-- RLS pour les paramètres fiscaux (un enregistrement par tenant).
ALTER TABLE parametres_fiscaux ENABLE ROW LEVEL SECURITY;

CREATE POLICY parametres_fiscaux_isolation ON parametres_fiscaux
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
