-- US8 (T804) — Tenant de démonstration en lecture seule.
--
-- Le drapeau est porté par le tenant (pas par l'utilisateur) : tout compte
-- rattaché au tenant de démonstration est bloqué en écriture par `hooks.server.ts`.
-- Aucune donnée métier n'est modifiée ; les tables existantes restent inchangées.
alter table tenants
  add column lecture_seule boolean not null default false;

comment on column tenants.lecture_seule is
  'true = démonstration : toute mutation authentifiée est refusée (GET/HEAD restent autorisés).';
