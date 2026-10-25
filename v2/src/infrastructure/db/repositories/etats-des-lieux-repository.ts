import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type {
  CreerEtatDesLieuxData,
  EtatsDesLieuxRepository,
} from "@/application/ports/etats-des-lieux-repository";
import type {
  EtatDesLieux,
  LigneEtatDesLieux,
  TypeEtatDesLieux,
} from "@/domain/etat-des-lieux";
import type { EtatBien } from "@/domain/inventaire";
import { withTenant } from "../client";
import {
  etatDesLieuxLignes,
  etatsDesLieux,
  type EtatDesLieuxLigneRow,
  type EtatDesLieuxRow,
} from "../schema";

function ligneVersDomaine(row: EtatDesLieuxLigneRow): LigneEtatDesLieux {
  return {
    bienId: row.bienId,
    qr: row.qr,
    libelle: row.libelle,
    etatReference: row.etatReference as EtatBien,
    prixReferenceCentimes: row.prixReferenceCentimes,
    etatConstate: row.etatConstate as EtatBien | null,
    manquant: row.manquant,
    commentaire: row.commentaire,
  };
}

function versDomaine(
  row: EtatDesLieuxRow,
  lignes: EtatDesLieuxLigneRow[],
): EtatDesLieux {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    reservationId: row.reservationId,
    ref: row.ref,
    type: row.type as TypeEtatDesLieux,
    date: row.date,
    notes: row.notes,
    lignes: lignes
      .map(ligneVersDomaine)
      .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr")),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleEtatsDesLieuxRepository implements EtatsDesLieuxRepository {
  async creer(data: CreerEtatDesLieuxData): Promise<EtatDesLieux> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(etatsDesLieux)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          reservationId: data.reservationId,
          ref: data.ref,
          type: data.type,
          date: data.date,
          notes: data.notes,
        })
        .returning();
      if (!row) throw new Error("État des lieux : aucune ligne retournée.");

      const lignes = await tx
        .insert(etatDesLieuxLignes)
        .values(
          data.lignes.map((ligne) => ({
            tenantId: data.tenantId,
            etatDesLieuxId: row.id,
            bienId: ligne.bienId,
            qr: ligne.qr,
            libelle: ligne.libelle,
            etatReference: ligne.etatReference,
            prixReferenceCentimes: ligne.prixReferenceCentimes,
            etatConstate: ligne.etatConstate,
            manquant: ligne.manquant,
            commentaire: ligne.commentaire,
          })),
        )
        .returning();

      return versDomaine(row, lignes);
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<EtatDesLieux | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(etatsDesLieux)
        .where(
          and(
            eq(etatsDesLieux.tenantId, tenantId),
            eq(etatsDesLieux.ref, ref),
          ),
        )
        .limit(1);
      if (!row) return null;
      const lignes = await tx
        .select()
        .from(etatDesLieuxLignes)
        .where(
          and(
            eq(etatDesLieuxLignes.tenantId, tenantId),
            eq(etatDesLieuxLignes.etatDesLieuxId, row.id),
          ),
        );
      return versDomaine(row, lignes);
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<EtatDesLieux | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(etatsDesLieux)
        .where(
          and(eq(etatsDesLieux.tenantId, tenantId), eq(etatsDesLieux.id, id)),
        )
        .limit(1);
      if (!row) return null;
      const lignes = await tx
        .select()
        .from(etatDesLieuxLignes)
        .where(
          and(
            eq(etatDesLieuxLignes.tenantId, tenantId),
            eq(etatDesLieuxLignes.etatDesLieuxId, row.id),
          ),
        )
        .orderBy(asc(etatDesLieuxLignes.libelle));
      return versDomaine(row, lignes);
    });
  }

  async listerParTenant(tenantId: string): Promise<EtatDesLieux[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(etatsDesLieux)
        .where(eq(etatsDesLieux.tenantId, tenantId))
        .orderBy(desc(etatsDesLieux.date), desc(etatsDesLieux.createdAt));
      if (rows.length === 0) return [];
      const lignes = await tx
        .select()
        .from(etatDesLieuxLignes)
        .where(
          and(
            eq(etatDesLieuxLignes.tenantId, tenantId),
            inArray(
              etatDesLieuxLignes.etatDesLieuxId,
              rows.map((row) => row.id),
            ),
          ),
        );
      const parEtat = new Map<string, EtatDesLieuxLigneRow[]>();
      for (const ligne of lignes) {
        const liste = parEtat.get(ligne.etatDesLieuxId) ?? [];
        liste.push(ligne);
        parEtat.set(ligne.etatDesLieuxId, liste);
      }
      return rows.map((row) => versDomaine(row, parEtat.get(row.id) ?? []));
    });
  }
}
