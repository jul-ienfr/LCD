import { and, asc, eq, sql } from "drizzle-orm";
import type {
  AffectationFournisseur,
  AffecterFournisseurData,
  ActivationFournisseur,
  EtatSyncFournisseur,
  FournisseurRepository,
  LogementAvecFournisseur,
} from "@/application/ports/fournisseur-repository";
import type { CodeFournisseur } from "@/domain/fournisseur";
import { ErreurMetier } from "@/domain/erreurs";
import { db, dbAdmin, withTenant } from "../client";
import {
  fournisseursCanaux,
  logements,
  logementsFournisseurs,
  tenants,
} from "../schema";

function versAffectation(
  row: typeof logementsFournisseurs.$inferSelect,
): AffectationFournisseur {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    fournisseurCode: row.fournisseurCode as CodeFournisseur,
    externalPropertyId: row.externalPropertyId,
    externalRoomTypeId: row.externalRoomTypeId,
    externalRatePlanId: row.externalRatePlanId,
    actif: row.actif,
    derniereSync: row.derniereSync,
    dernierStatut: row.dernierStatut,
    dernierMessage: row.dernierMessage,
    derniereEmpreinte: row.derniereEmpreinte,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function versActivation(
  row: typeof fournisseursCanaux.$inferSelect,
): ActivationFournisseur {
  return {
    code: row.code as CodeFournisseur,
    actif: row.actif,
    ordre: row.ordre,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
}

export class DrizzleFournisseurRepository implements FournisseurRepository {
  async listerActivations(): Promise<ActivationFournisseur[] | null> {
    const client = dbAdmin ?? db;
    const rows = await client
      .select()
      .from(fournisseursCanaux)
      .orderBy(asc(fournisseursCanaux.ordre), asc(fournisseursCanaux.code));
    return rows.map(versActivation);
  }

  async listerLogementsAvecFournisseur(): Promise<
    LogementAvecFournisseur[] | null
  > {
    if (!dbAdmin) return null;
    const rows = await dbAdmin
      .select({
        tenantId: tenants.id,
        tenantNom: tenants.nom,
        tenantSlug: tenants.slug,
        logementId: logements.id,
        logementNom: logements.nom,
        logementCode: logements.code,
        fournisseurCode: logementsFournisseurs.fournisseurCode,
        externalPropertyId: logementsFournisseurs.externalPropertyId,
        externalRoomTypeId: logementsFournisseurs.externalRoomTypeId,
        externalRatePlanId: logementsFournisseurs.externalRatePlanId,
        actif: logementsFournisseurs.actif,
        derniereSync: logementsFournisseurs.derniereSync,
        dernierStatut: logementsFournisseurs.dernierStatut,
        dernierMessage: logementsFournisseurs.dernierMessage,
      })
      .from(logements)
      .innerJoin(tenants, eq(tenants.id, logements.tenantId))
      .leftJoin(
        logementsFournisseurs,
        eq(logementsFournisseurs.logementId, logements.id),
      )
      .orderBy(asc(tenants.nom), asc(logements.nom));

    return rows.map((row) => ({
      tenantId: row.tenantId,
      tenantNom: row.tenantNom,
      tenantSlug: row.tenantSlug,
      logementId: row.logementId,
      logementNom: row.logementNom,
      logementCode: row.logementCode,
      fournisseurCode: row.fournisseurCode as CodeFournisseur | null,
      externalPropertyId: row.externalPropertyId,
      externalRoomTypeId: row.externalRoomTypeId,
      externalRatePlanId: row.externalRatePlanId,
      actif: row.actif ?? false,
      derniereSync: row.derniereSync,
      dernierStatut: row.dernierStatut,
      dernierMessage: row.dernierMessage,
    }));
  }

  async definirActivation(
    code: CodeFournisseur,
    actif: boolean,
    acteur: string,
  ): Promise<void> {
    if (!dbAdmin) {
      throw new ErreurMetier(
        "FOURNISSEUR_INDISPONIBLE",
        "Connexion owner absente : activation impossible.",
      );
    }
    const rows = await dbAdmin
      .update(fournisseursCanaux)
      .set({ actif, updatedBy: acteur })
      .where(eq(fournisseursCanaux.code, code))
      .returning({ code: fournisseursCanaux.code });
    if (rows.length === 0) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "Fournisseur inconnu dans le registre.",
      );
    }
  }

  async affecter(
    data: AffecterFournisseurData,
  ): Promise<AffectationFournisseur> {
    if (!dbAdmin) {
      throw new ErreurMetier(
        "FOURNISSEUR_INDISPONIBLE",
        "Connexion owner absente : affectation impossible.",
      );
    }
    const [logement] = await dbAdmin
      .select({ id: logements.id })
      .from(logements)
      .where(
        and(
          eq(logements.id, data.logementId),
          eq(logements.tenantId, data.tenantId),
        ),
      )
      .limit(1);
    if (!logement) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "Logement introuvable dans cet espace.",
      );
    }

    let row: typeof logementsFournisseurs.$inferSelect | undefined;
    try {
      [row] = await dbAdmin
        .insert(logementsFournisseurs)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          fournisseurCode: data.fournisseurCode,
          externalPropertyId: data.externalPropertyId,
          externalRoomTypeId: data.externalRoomTypeId,
          externalRatePlanId: data.externalRatePlanId,
          actif: true,
        })
        .onConflictDoUpdate({
          target: logementsFournisseurs.logementId,
          set: {
            tenantId: data.tenantId,
            fournisseurCode: data.fournisseurCode,
            externalPropertyId: data.externalPropertyId,
            externalRoomTypeId: data.externalRoomTypeId,
            externalRatePlanId: data.externalRatePlanId,
            actif: true,
            updatedAt: new Date(),
          },
        })
        .returning();
    } catch (erreur) {
      if (
        typeof erreur === "object" &&
        erreur !== null &&
        "code" in erreur &&
        erreur.code === "23505"
      ) {
        throw new ErreurMetier(
          "FOURNISSEUR_INVALIDE",
          "Cette propriété externe est déjà affectée à un autre logement.",
        );
      }
      throw erreur;
    }
    if (!row) {
      throw new ErreurMetier(
        "FOURNISSEUR_INDISPONIBLE",
        "Affectation non enregistrée.",
      );
    }
    return versAffectation(row);
  }

  async basculerActivation(
    tenantId: string,
    logementId: string,
    actif: boolean,
  ): Promise<AffectationFournisseur | null> {
    if (!dbAdmin) {
      throw new ErreurMetier(
        "FOURNISSEUR_INDISPONIBLE",
        "Connexion owner absente : bascule impossible.",
      );
    }
    const [row] = await dbAdmin
      .update(logementsFournisseurs)
      .set({ actif, updatedAt: new Date() })
      .where(
        and(
          eq(logementsFournisseurs.tenantId, tenantId),
          eq(logementsFournisseurs.logementId, logementId),
        ),
      )
      .returning();
    return row ? versAffectation(row) : null;
  }

  async retirer(tenantId: string, logementId: string): Promise<void> {
    if (!dbAdmin) {
      throw new ErreurMetier(
        "FOURNISSEUR_INDISPONIBLE",
        "Connexion owner absente : retrait impossible.",
      );
    }
    await dbAdmin
      .delete(logementsFournisseurs)
      .where(
        and(
          eq(logementsFournisseurs.tenantId, tenantId),
          eq(logementsFournisseurs.logementId, logementId),
        ),
      );
  }

  async trouverAffectation(
    tenantId: string,
    logementId: string,
  ): Promise<AffectationFournisseur | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(logementsFournisseurs)
        .where(
          and(
            eq(logementsFournisseurs.tenantId, tenantId),
            eq(logementsFournisseurs.logementId, logementId),
          ),
        )
        .limit(1);
      return row ? versAffectation(row) : null;
    });
  }

  async listerAffectationsActives(
    code?: CodeFournisseur,
  ): Promise<AffectationFournisseur[] | null> {
    if (!dbAdmin) return null;
    const conditions = [eq(logementsFournisseurs.actif, true)];
    if (code) conditions.push(eq(logementsFournisseurs.fournisseurCode, code));
    const rows = await dbAdmin
      .select()
      .from(logementsFournisseurs)
      .where(and(...conditions))
      .orderBy(
        asc(logementsFournisseurs.fournisseurCode),
        // Rotation équitable : les logements jamais synchronisés passent
        // d'abord, puis les plus anciens, même au-delà de la limite du cycle.
        sql`${logementsFournisseurs.derniereSync} asc nulls first`,
        asc(logementsFournisseurs.tenantId),
        asc(logementsFournisseurs.logementId),
      );
    return rows.map(versAffectation);
  }

  async trouverParProprieteExterne(
    code: CodeFournisseur,
    externalPropertyId: string,
  ): Promise<AffectationFournisseur | null> {
    if (!dbAdmin) return null;
    const [row] = await dbAdmin
      .select()
      .from(logementsFournisseurs)
      .where(
        and(
          eq(logementsFournisseurs.fournisseurCode, code),
          eq(logementsFournisseurs.externalPropertyId, externalPropertyId),
          eq(logementsFournisseurs.actif, true),
        ),
      )
      .limit(1);
    return row ? versAffectation(row) : null;
  }

  async enregistrerSync(
    tenantId: string,
    logementId: string,
    etat: EtatSyncFournisseur,
  ): Promise<void> {
    if (!dbAdmin) {
      throw new ErreurMetier(
        "FOURNISSEUR_INDISPONIBLE",
        "Connexion owner absente : état de synchronisation non enregistré.",
      );
    }
    await dbAdmin
      .update(logementsFournisseurs)
      .set({
        derniereSync: new Date(),
        dernierStatut: etat.statut,
        dernierMessage: etat.message,
        derniereEmpreinte: etat.empreinte,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(logementsFournisseurs.tenantId, tenantId),
          eq(logementsFournisseurs.logementId, logementId),
        ),
      );
  }
}
