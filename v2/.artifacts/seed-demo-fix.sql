WITH t AS (SELECT id FROM tenants WHERE slug = 'lcd'),
v(code, nom, adresse, guide, prix) AS (
  VALUES
    ('villa-santa-severa', 'Villa Santa Severa', 'Sainte-Maxime', 'Villa contemporaine avec piscine chauffée, grande terrasse et vue dégagée sur les pins. Quatre chambres, deux salles d''eau, cuisine ouverte.', 24000),
    ('mas-des-oliviers', 'Le Mas des Oliviers', 'Grimaud', 'Mas provençal restauré au milieu des oliviers. Piscine, cuisine d''été et cinq chambres, à dix minutes des plages.', 18500),
    ('loft-du-port', 'Le Loft du Port', 'Saint-Tropez', 'Loft lumineux au calme, à deux pas du port. Deux chambres, belle hauteur sous plafond et terrasse pour les petits-déjeuners.', 16000)
),
ins AS (
  INSERT INTO logements (
    tenant_id, code, nom, adresse, guide_texte, copro_verifiee, publication, statut
  )
  SELECT t.id, v.code, v.nom, v.adresse, v.guide, true, 'publiee', 'actif'
  FROM t CROSS JOIN v
  ON CONFLICT (tenant_id, code) DO UPDATE SET
    nom = EXCLUDED.nom,
    adresse = EXCLUDED.adresse,
    guide_texte = EXCLUDED.guide_texte,
    copro_verifiee = true,
    publication = 'publiee',
    statut = 'actif',
    updated_at = now()
  RETURNING id, code
)
INSERT INTO tarifs (tenant_id, logement_id, date, prix_centimes, source)
SELECT t.id, ins.id, (CURRENT_DATE + g)::date, v.prix, 'manuel'
FROM ins
JOIN v ON v.code = ins.code
CROSS JOIN t
CROSS JOIN generate_series(0, 119) AS g
ON CONFLICT (tenant_id, logement_id, date) WHERE plan_tarifaire_id IS NULL
DO UPDATE SET prix_centimes = EXCLUDED.prix_centimes, updated_at = now();
