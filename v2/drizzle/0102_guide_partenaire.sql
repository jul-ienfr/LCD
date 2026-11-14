-- T712 (révisé 2026-11-10) — guide partenaire hébergé par logement.
-- Duve, Touch Stay ou tout autre guide externe : on stocke uniquement le nom
-- affiché et l'URL HTTPS. Aucun secret ni contenu n'est dupliqué.

alter table logements
  add column guide_partenaire_nom text,
  add column guide_partenaire_url text;
