import { randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { sql } from "@/infrastructure/db/client";

export interface VerrouSysteme {
  titulaire: string;
  /** false si le bail a expiré et a été repris par une autre instance. */
  renouveler(): Promise<boolean>;
  liberer(): Promise<void>;
}

export type VerrouIcs = VerrouSysteme;

/**
 * Verrou distribué à bail, compatible pooler (pas de verrou de session).
 * Une instance qui meurt libère automatiquement sa place à l'expiration.
 */
export async function acquerirVerrouSysteme(
  nom: string,
  bailMinutes = 10,
): Promise<VerrouSysteme | null> {
  const titulaire = `${hostname()}:${process.pid}:${randomUUID()}`;
  const rows = await sql`
    insert into verrous_systeme (nom, titulaire, expire_le)
    values (
      ${nom},
      ${titulaire},
      now() + make_interval(mins => ${bailMinutes})
    )
    on conflict (nom) do update
      set titulaire = excluded.titulaire,
          expire_le = excluded.expire_le
      where verrous_systeme.expire_le < now()
    returning nom
  `;
  if (rows.length === 0) return null;

  return {
    titulaire,
    async renouveler() {
      const renouveles = await sql`
        update verrous_systeme
        set expire_le = now() + make_interval(mins => ${bailMinutes})
        where nom = ${nom} and titulaire = ${titulaire}
        returning nom
      `;
      return renouveles.length > 0;
    },
    async liberer() {
      await sql`
        delete from verrous_systeme
        where nom = ${nom} and titulaire = ${titulaire}
      `;
    },
  };
}

export async function acquerirVerrouIcs(
  bailMinutes = 10,
): Promise<VerrouIcs | null> {
  return acquerirVerrouSysteme("ics-sync", bailMinutes);
}
