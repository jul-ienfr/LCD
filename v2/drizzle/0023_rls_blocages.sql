-- RLS pour les blocages de calendrier (OTA, indisponibilités).
ALTER TABLE blocages ENABLE ROW LEVEL SECURITY;

CREATE POLICY blocages_isolation ON blocages
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
