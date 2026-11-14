-- T209 — résolution publique d'un domaine actif, sans exposer la table.
-- Le rôle applicatif ne peut lire que le slug du tenant pour un hôte exact.

create or replace function domaine_public_par_hote(p_hote text)
returns table (slug text)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select t.slug
  from domaines d
  join tenants t on t.id = d.tenant_id
  where d.domaine = lower(trim(p_hote))
    and d.statut = 'actif'
    and t.statut = 'actif'
  limit 1
$$;

revoke all on function domaine_public_par_hote(text) from public;
grant execute on function domaine_public_par_hote(text) to lcd_app;
