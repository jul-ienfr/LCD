-- Rattachement des messages existants aux fils voyageurs (correction du
-- backfill de 0090, qui ne traitait que les messages porteurs d'une
-- réservation). Les messages réels portent un `logement_id` et un
-- destinataire (sortant) ou un expéditeur (entrant) : on regroupe par
-- contact e-mail, sinon par logement.
--> statement-breakpoint
INSERT INTO "fils_voyageur"
  (tenant_id, logement_id, voyageur_nom, voyageur_email, cle_regroupement,
   statut, dernier_message_at, created_at, updated_at)
SELECT
  c.tenant_id,
  (array_agg(c.logement_id ORDER BY c.created_at DESC))[1],
  COALESCE(max(c.contact), 'Voyageur'),
  CASE
    WHEN max(c.contact) ~* '^[^@[:space:]]+@[^@[:space:]]+$'
      THEN lower(max(c.contact))
    ELSE NULL
  END,
  c.cle,
  'ouvert',
  max(c.created_at),
  min(c.created_at),
  now()
FROM (
  SELECT
    m.tenant_id,
    m.logement_id,
    m.created_at,
    CASE
      WHEN m.sens = 'entrant' THEN NULLIF(btrim(COALESCE(m.expediteur, '')), '')
      ELSE NULLIF(btrim(COALESCE(m.destinataire, '')), '')
    END AS contact,
    CASE
      WHEN NULLIF(
             btrim(
               COALESCE(
                 CASE
                   WHEN m.sens = 'entrant' THEN m.expediteur
                   ELSE m.destinataire
                 END,
                 ''
               )
             ),
             ''
           ) ~* '^[^@[:space:]]+@[^@[:space:]]+$'
        THEN 'email:' || lower(
               btrim(
                 CASE
                   WHEN m.sens = 'entrant' THEN m.expediteur
                   ELSE m.destinataire
                 END
               )
             )
      ELSE 'ext:logement:' || m.logement_id::text
    END AS cle
  FROM "messages_voyageur" m
  WHERE m.fil_id IS NULL
) c
GROUP BY c.tenant_id, c.cle
ON CONFLICT (tenant_id, cle_regroupement) DO NOTHING;
--> statement-breakpoint
UPDATE "messages_voyageur" m
SET fil_id = f.id
FROM "fils_voyageur" f
WHERE m.fil_id IS NULL
  AND f.tenant_id = m.tenant_id
  AND f.cle_regroupement = CASE
    WHEN NULLIF(
           btrim(
             COALESCE(
               CASE WHEN m.sens = 'entrant' THEN m.expediteur ELSE m.destinataire END,
               ''
             )
           ),
           ''
         ) ~* '^[^@[:space:]]+@[^@[:space:]]+$'
      THEN 'email:' || lower(
             btrim(
               CASE WHEN m.sens = 'entrant' THEN m.expediteur ELSE m.destinataire END
             )
           )
    ELSE 'ext:logement:' || m.logement_id::text
  END;
