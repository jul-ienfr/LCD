-- RLS pour les flux ICS OTA.
ALTER TABLE flux_ics ENABLE ROW LEVEL SECURITY;

CREATE POLICY flux_ics_isolation ON flux_ics
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
