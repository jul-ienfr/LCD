import {
  and,
  asc,
  desc,
  eq,
  sql,
} from "drizzle-orm";
import type {
  EnregistrerFluxIcsData,
  EnregistrerRunIcsData,
  FluxIcsRepository,
  MarquerSyncFluxIcsData,
  ResumeSanteIcs,
  RunIcs,
} from "@/application/ports/flux-ics-repository";
import { ErreurMetier } from "@/domain/erreurs";
import type { FluxIcs } from "@/domain/flux-ics";
import { db, withTenant } from "../client";
import { fluxIcs, icsSyncRuns } from "../schema";

interface LigneFluxBrute {
  id: string;
  tenant_id: string;
  logement_id: string;
  canal_id: string | null;
  libelle: string;
  url: string;
  actif: boolean;
  intervalle_minutes: number;
  derniere_sync: Date | null;
  derniere_tentative: Date | null;
  prochain_essai: Date | null;
  dernier_statut: string | null;
  dernier_message: string | null;
  echecs_consecutifs: number;
  vides_consecutifs: number;
  etag: string | null;
  derniere_modification: string | null;
  empreinte: string | null;
  created_at: Date;
  updated_at: Date;
}

function versDomaineBrut(row: LigneFluxBrute): FluxIcs {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    logementId: row.logement_id,
    canalId: row.canal_id,
    libelle: row.libelle,
    url: row.url,
    actif: row.actif,
    intervalleMinutes: row.intervalle_minutes,
    derniereSync: row.derniere_sync,
    derniereTentative: row.derniere_tentative,
    prochainEssai: row.prochain_essai,
    dernierStatut: row.dernier_statut as FluxIcs["dernierStatut"],
    dernierMessage: row.dernier_message,
    echecsConsecutifs: row.echecs_consecutifs,
    videsConsecutifs: row.vides_consecutifs,
    etag: row.etag,
    derniereModification: row.derniere_modification,
    empreinte: row.empreinte,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function versDate(valeur: unknown): Date | null {
  if (valeur instanceof Date) return valeur;
  if (typeof valeur !== "string" || !valeur) return null;
  const date = new Date(valeur);
  return Number.isNaN(date.getTime()) ? null : date;
}

function versDomaine(row: typeof fluxIcs.$inferSelect): FluxIcs {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    canalId: row.canalId,
    libelle: row.libelle,
    url: row.url,
    actif: row.actif,
    intervalleMinutes: row.intervalleMinutes,
    derniereSync: row.derniereSync,
    derniereTentative: row.derniereTentative,
    prochainEssai: row.prochainEssai,
    dernierStatut: row.dernierStatut as FluxIcs["dernierStatut"],
    dernierMessage: row.dernierMessage,
    echecsConsecutifs: row.echecsConsecutifs,
    videsConsecutifs: row.videsConsecutifs,
    etag: row.etag,
    derniereModification: row.derniereModification,
    empreinte: row.empreinte,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function versRun(row: typeof icsSyncRuns.$inferSelect): RunIcs {
  return {
    id: row.id,
    fluxIcsId: row.fluxIcsId,
    debut: row.debut,
    fin: row.fin,
    statut: row.statut as RunIcs["statut"],
    statutHttp: row.statutHttp,
    dureeMs: row.dureeMs,
    evenements: row.evenements,
    crees: row.crees,
    misAJour: row.misAJour,
    annules: row.annules,
    deja: row.deja,
    conflits: row.conflits,
    ignores: row.ignores,
    message: row.message,
    details: row.details ?? null,
  };
}

export class DrizzleFluxIcsRepository implements FluxIcsRepository {
  async enregistrer(data: EnregistrerFluxIcsData): Promise<FluxIcs> {
    return withTenant(data.tenantId, async (tx) => {
      const canalId = data.canalId;
      const [parCanal] = canalId
        ? await tx
            .select()
            .from(fluxIcs)
            .where(
              and(
                eq(fluxIcs.tenantId, data.tenantId),
                eq(fluxIcs.logementId, data.logementId),
                eq(fluxIcs.canalId, canalId),
              ),
            )
            .limit(1)
        : [];
      const [parUrl] = await tx
        .select()
        .from(fluxIcs)
        .where(
          and(
            eq(fluxIcs.tenantId, data.tenantId),
            eq(fluxIcs.logementId, data.logementId),
            eq(fluxIcs.url, data.url),
          ),
        )
        .limit(1);

      if (
        canalId !== undefined &&
        parUrl &&
        parUrl.canalId &&
        parUrl.canalId !== canalId
      ) {
        throw new ErreurMetier(
          "FLUX_ICS_INVALIDE",
          "Cette URL est déjà associée à un autre canal.",
        );
      }
      if (
        canalId !== undefined &&
        parCanal &&
        parUrl &&
        parUrl.id !== parCanal.id &&
        parUrl.canalId === null
      ) {
        throw new ErreurMetier(
          "FLUX_ICS_INVALIDE",
          "Cette URL est déjà utilisée par un autre flux. Retirez l’ancien flux ou associez-le au canal.",
        );
      }

      const cible = parCanal ?? parUrl;
      if (cible) {
        const [row] = await tx
          .update(fluxIcs)
          .set({
            canalId: canalId === undefined ? cible.canalId : canalId,
            libelle: data.libelle,
            url: data.url,
            actif: true,
            intervalleMinutes: data.intervalleMinutes ?? 5,
            updatedAt: new Date(),
          })
          .where(eq(fluxIcs.id, cible.id))
          .returning();
        if (!row) throw new Error("Flux ICS : aucune ligne retournée.");
        return versDomaine(row);
      }

      const [row] = await tx
        .insert(fluxIcs)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          canalId: canalId ?? null,
          libelle: data.libelle,
          url: data.url,
          intervalleMinutes: data.intervalleMinutes ?? 5,
        })
        .returning();
      if (!row) throw new Error("Flux ICS : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<FluxIcs[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(fluxIcs)
        .where(
          and(
            eq(fluxIcs.tenantId, tenantId),
            eq(fluxIcs.logementId, logementId),
          ),
        )
        .orderBy(asc(fluxIcs.libelle));
      return rows.map(versDomaine);
    });
  }

  async listerParTenant(tenantId: string): Promise<FluxIcs[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(fluxIcs)
        .where(eq(fluxIcs.tenantId, tenantId))
        .orderBy(asc(fluxIcs.libelle));
      return rows.map(versDomaine);
    });
  }

  async listerActifsGlobal(): Promise<FluxIcs[]> {
    // Fonction SECURITY DEFINER : la découverte cross-tenant reste possible
    // avec le rôle applicatif soumis à RLS, sans exposer une connexion owner.
    const rows = (await db.execute(
      sql`select * from public.lister_flux_ics_a_synchroniser(1000, true)`,
    )) as unknown as LigneFluxBrute[];
    return rows.map(versDomaineBrut);
  }

  async listerDusGlobal(_maintenant: Date, limite: number): Promise<FluxIcs[]> {
    const rows = (await db.execute(
      sql`select * from public.lister_flux_ics_a_synchroniser(${limite}, false)`,
    )) as unknown as LigneFluxBrute[];
    return rows.map(versDomaineBrut);
  }

  async trouverParId(tenantId: string, id: string): Promise<FluxIcs | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(fluxIcs)
        .where(and(eq(fluxIcs.tenantId, tenantId), eq(fluxIcs.id, id)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async marquerSync(
    tenantId: string,
    id: string,
    data: MarquerSyncFluxIcsData,
  ): Promise<FluxIcs | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(fluxIcs)
        .set({
          derniereTentative: data.date,
          ...(data.statut === "erreur" ? {} : { derniereSync: data.date }),
          dernierStatut: data.statut,
          dernierMessage: data.message,
          ...(data.etag !== undefined ? { etag: data.etag } : {}),
          ...(data.derniereModification !== undefined
            ? { derniereModification: data.derniereModification }
            : {}),
          ...(data.empreinte !== undefined
            ? { empreinte: data.empreinte }
            : {}),
          ...(data.echecsConsecutifs !== undefined
            ? { echecsConsecutifs: data.echecsConsecutifs }
            : {}),
          ...(data.prochainEssai !== undefined
            ? { prochainEssai: data.prochainEssai }
            : {}),
          ...(data.videsConsecutifs !== undefined
            ? { videsConsecutifs: data.videsConsecutifs }
            : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(fluxIcs.tenantId, tenantId), eq(fluxIcs.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }

  async enregistrerRun(data: EnregistrerRunIcsData): Promise<void> {
    await withTenant(data.tenantId, async (tx) => {
      await tx.insert(icsSyncRuns).values({
        tenantId: data.tenantId,
        fluxIcsId: data.fluxIcsId,
        debut: data.debut,
        fin: data.fin,
        statut: data.statut,
        statutHttp: data.statutHttp,
        dureeMs: data.dureeMs,
        evenements: data.evenements,
        crees: data.crees,
        misAJour: data.misAJour,
        annules: data.annules,
        deja: data.deja,
        conflits: data.conflits,
        ignores: data.ignores,
        message: data.message,
        details: data.details ?? null,
      });
    });
  }

  async listerRuns(
    tenantId: string,
    fluxIcsId: string,
    limite: number,
  ): Promise<RunIcs[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(icsSyncRuns)
        .where(
          and(
            eq(icsSyncRuns.tenantId, tenantId),
            eq(icsSyncRuns.fluxIcsId, fluxIcsId),
          ),
        )
        .orderBy(desc(icsSyncRuns.debut))
        .limit(limite);
      return rows.map(versRun);
    });
  }

  async resumeSanteGlobal(
    _maintenant: Date,
    toleranceMinutes: number,
  ): Promise<ResumeSanteIcs> {
    const rows = (await db.execute(
      sql`select public.resume_ics_sync(${toleranceMinutes}) as resume`,
    )) as unknown as Array<{ resume: Record<string, unknown> | null }>;
    const resume = rows[0]?.resume ?? {};
    return {
      actifs: Number(resume.actifs ?? 0),
      enErreur: Number(resume.enErreur ?? 0),
      enRetard: Number(resume.enRetard ?? 0),
      jamaisSync: Number(resume.jamaisSync ?? 0),
      conflits24h: Number(resume.conflits24h ?? 0),
      dernierCycle: versDate(resume.dernierCycle),
    };
  }

  async nettoyerRunsGlobal(jours: number): Promise<number> {
    const rows = (await db.execute(
      sql`select public.purger_ics_sync_runs(${jours}) as supprimes`,
    )) as unknown as Array<{ supprimes: number | string }>;
    return Number(rows[0]?.supprimes ?? 0);
  }

  async supprimer(tenantId: string, id: string): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .delete(fluxIcs)
        .where(and(eq(fluxIcs.tenantId, tenantId), eq(fluxIcs.id, id)));
    });
  }
}
