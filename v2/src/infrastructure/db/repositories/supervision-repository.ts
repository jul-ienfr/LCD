import { and, count, desc, eq, gte, ilike } from "drizzle-orm";
import { dbAdmin, sqlAdmin } from "../client";
import {
  auditLogs,
  logements,
  reservations,
  tenants,
  users,
} from "../schema";

export interface LigneSupervision {
  tenantId: string;
  slug: string;
  nom: string;
  statut: string;
  logements: number;
  reservations: number;
  utilisateurs: number;
  audits24h: number;
}

export interface SituationSupervision {
  lignes: LigneSupervision[];
  totals: {
    tenants: number;
    logements: number;
    reservations: number;
    utilisateurs: number;
    audits24h: number;
  };
}

export interface EtatSysteme {
  utilisateur: string;
  superutilisateur: boolean;
  versionBase: string;
  migrations: number;
  derniereMigration: string | null;
  tables: number;
  tablesRls: number;
  tailleBase: string;
  tenants: number;
}

export interface EntreeJournal {
  id: string;
  tenantSlug: string | null;
  tenantNom: string | null;
  qui: string;
  action: string;
  cible: string | null;
  ref: string | null;
  createdAt: Date;
  payload: Record<string, unknown>;
}

export class DrizzleSupervisionRepository {
  async listerTenants(): Promise<
    { id: string; slug: string; nom: string }[] | null
  > {
    if (!dbAdmin) return null;
    return dbAdmin
      .select({ id: tenants.id, slug: tenants.slug, nom: tenants.nom })
      .from(tenants)
      .orderBy(tenants.nom);
  }

  async situation(): Promise<SituationSupervision | null> {
    if (!dbAdmin) return null;
    const lignesTenants = await dbAdmin
      .select()
      .from(tenants)
      .orderBy(tenants.nom);
    const depuis = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lignes: LigneSupervision[] = [];
    for (const tenant of lignesTenants) {
      const [logementsCount] = await dbAdmin
        .select({ n: count() })
        .from(logements)
        .where(eq(logements.tenantId, tenant.id));
      const [reservationsCount] = await dbAdmin
        .select({ n: count() })
        .from(reservations)
        .where(eq(reservations.tenantId, tenant.id));
      const [utilisateursCount] = await dbAdmin
        .select({ n: count() })
        .from(users)
        .where(and(eq(users.tenantId, tenant.id), eq(users.actif, true)));
      const [auditsCount] = await dbAdmin
        .select({ n: count() })
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.tenantId, tenant.id),
            gte(auditLogs.createdAt, depuis),
          ),
        );
      lignes.push({
        tenantId: tenant.id,
        slug: tenant.slug,
        nom: tenant.nom,
        statut: tenant.statut,
        logements: Number(logementsCount?.n ?? 0),
        reservations: Number(reservationsCount?.n ?? 0),
        utilisateurs: Number(utilisateursCount?.n ?? 0),
        audits24h: Number(auditsCount?.n ?? 0),
      });
    }

    return {
      lignes,
      totals: {
        tenants: lignes.length,
        logements: lignes.reduce((total, ligne) => total + ligne.logements, 0),
        reservations: lignes.reduce(
          (total, ligne) => total + ligne.reservations,
          0,
        ),
        utilisateurs: lignes.reduce(
          (total, ligne) => total + ligne.utilisateurs,
          0,
        ),
        audits24h: lignes.reduce((total, ligne) => total + ligne.audits24h, 0),
      },
    };
  }

  async etatSysteme(): Promise<EtatSysteme | null> {
    if (!dbAdmin || !sqlAdmin) return null;
    const [identite] = await sqlAdmin<
      {
        utilisateur: string;
        superutilisateur: boolean;
        versionBase: string;
        tailleBase: string;
        tenants: number;
      }[]
    >`
      select
        current_user as "utilisateur",
        coalesce(
          (select rolsuper from pg_roles where rolname = current_user),
          false
        ) as "superutilisateur",
        current_setting('server_version') as "versionBase",
        pg_size_pretty(pg_database_size(current_database())) as "tailleBase",
        (select count(*)::int from tenants) as "tenants"
    `;
    const [migrations] = await sqlAdmin<
      { nombre: number; derniere: string | null }[]
    >`
      select
        count(*)::int as "nombre",
        to_char(
          to_timestamp(max(created_at) / 1000),
          'YYYY-MM-DD HH24:MI'
        ) as "derniere"
      from drizzle.__drizzle_migrations
    `;
    const [catalogue] = await sqlAdmin<{ tables: number; rls: number }[]>`
      select
        count(*)::int as "tables",
        count(*) filter (where c.relrowsecurity)::int as "rls"
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
    `;

    return {
      utilisateur: identite?.utilisateur ?? "?",
      superutilisateur: Boolean(identite?.superutilisateur),
      versionBase: identite?.versionBase ?? "?",
      migrations: Number(migrations?.nombre ?? 0),
      derniereMigration: migrations?.derniere ?? null,
      tables: Number(catalogue?.tables ?? 0),
      tablesRls: Number(catalogue?.rls ?? 0),
      tailleBase: identite?.tailleBase ?? "?",
      tenants: Number(identite?.tenants ?? 0),
    };
  }

  async journal(options: {
    tenantId?: string;
    action?: string;
    limite?: number;
  }): Promise<EntreeJournal[] | null> {
    if (!dbAdmin) return null;
    const conditions = [];
    if (options.tenantId) {
      conditions.push(eq(auditLogs.tenantId, options.tenantId));
    }
    if (options.action) {
      conditions.push(
        ilike(auditLogs.action, `%${options.action.replace(/[%_\\]/g, "\\$&")}%`),
      );
    }
    const rows = await dbAdmin
      .select({
        id: auditLogs.id,
        tenantSlug: tenants.slug,
        tenantNom: tenants.nom,
        qui: auditLogs.qui,
        action: auditLogs.action,
        cible: auditLogs.cible,
        ref: auditLogs.ref,
        createdAt: auditLogs.createdAt,
        payload: auditLogs.payload,
      })
      .from(auditLogs)
      .leftJoin(tenants, eq(tenants.id, auditLogs.tenantId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(Math.max(1, Math.min(options.limite ?? 200, 500)));

    return rows.map((row) => ({
      id: row.id,
      tenantSlug: row.tenantSlug,
      tenantNom: row.tenantNom,
      qui: row.qui,
      action: row.action,
      cible: row.cible,
      ref: row.ref,
      createdAt: row.createdAt,
      payload: row.payload,
    }));
  }
}
