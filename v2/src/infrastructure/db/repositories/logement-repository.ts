import { and, eq } from "drizzle-orm";
import type {
  CreerLogementData,
  LogementRepository,
} from "@/application/ports/logement-repository";
import type { Logement } from "@/domain/logement";
import { withTenant } from "../client";
import { logements } from "../schema";

function versDomaine(row: typeof logements.$inferSelect): Logement {
  return {
    id: row.id,
    tenantId: row.tenantId,
    code: row.code,
    nom: row.nom,
    adresse: row.adresse ?? undefined,
    checkinHeure: row.checkinHeure ?? undefined,
    checkinInstructions: row.checkinInstructions ?? undefined,
    wifiSsid: row.wifiSsid ?? undefined,
    wifiPassword: row.wifiPassword ?? undefined,
    regles: row.regles ?? undefined,
    urgenceTel: row.urgenceTel ?? undefined,
    guideTexte: row.guideTexte ?? undefined,
    coproVerifiee: row.coproVerifiee,
    coproVerifieeLe: row.coproVerifieeLe ?? undefined,
    cutoffJours: row.cutoffJours,
    bufferJours: row.bufferJours,
    strategiePrix: row.strategiePrix as Logement["strategiePrix"],
    publication: row.publication as Logement["publication"],
    statut: row.statut as Logement["statut"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleLogementRepository implements LogementRepository {
  async creer(data: CreerLogementData): Promise<Logement> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(logements)
        .values({
          tenantId: data.tenantId,
          code: data.code,
          nom: data.nom,
          adresse: data.adresse,
        })
        .returning();

      if (!row) throw new Error("Création du logement : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async listerParTenant(tenantId: string): Promise<Logement[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(logements)
        .where(eq(logements.tenantId, tenantId));
      return rows.map(versDomaine);
    });
  }

  async trouverParCode(
    tenantId: string,
    code: string,
  ): Promise<Logement | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(logements)
        .where(
          and(eq(logements.tenantId, tenantId), eq(logements.code, code)),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Logement | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(logements)
        .where(and(eq(logements.tenantId, tenantId), eq(logements.id, id)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async mettreAJourGuide(
    tenantId: string,
    id: string,
    data: {
      checkinHeure: string | null;
      checkinInstructions: string | null;
      wifiSsid: string | null;
      wifiPassword: string | null;
      regles: string | null;
      urgenceTel: string | null;
      guideTexte: string | null;
    },
  ): Promise<Logement | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(logements)
        .set({
          checkinHeure: data.checkinHeure,
          checkinInstructions: data.checkinInstructions,
          wifiSsid: data.wifiSsid,
          wifiPassword: data.wifiPassword,
          regles: data.regles,
          urgenceTel: data.urgenceTel,
          guideTexte: data.guideTexte,
          updatedAt: new Date(),
        })
        .where(and(eq(logements.tenantId, tenantId), eq(logements.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }

  async definirCopro(
    tenantId: string,
    id: string,
    verifiee: boolean,
  ): Promise<Logement | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(logements)
        .set({
          coproVerifiee: verifiee,
          coproVerifieeLe: verifiee ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(and(eq(logements.tenantId, tenantId), eq(logements.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }

  async definirCutoff(
    tenantId: string,
    id: string,
    jours: number,
  ): Promise<Logement | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(logements)
        .set({ cutoffJours: jours, updatedAt: new Date() })
        .where(and(eq(logements.tenantId, tenantId), eq(logements.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }

  async definirBuffer(
    tenantId: string,
    id: string,
    jours: number,
  ): Promise<Logement | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(logements)
        .set({ bufferJours: jours, updatedAt: new Date() })
        .where(and(eq(logements.tenantId, tenantId), eq(logements.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }

  async definirStrategiePrix(
    tenantId: string,
    id: string,
    strategie: Logement["strategiePrix"],
  ): Promise<Logement | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(logements)
        .set({ strategiePrix: strategie, updatedAt: new Date() })
        .where(and(eq(logements.tenantId, tenantId), eq(logements.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: Logement["statut"],
  ): Promise<Logement | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(logements)
        .set({ statut, updatedAt: new Date() })
        .where(and(eq(logements.tenantId, tenantId), eq(logements.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }

  async changerPublication(
    tenantId: string,
    id: string,
    publication: Logement["publication"],
  ): Promise<Logement | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(logements)
        .set({ publication, updatedAt: new Date() })
        .where(and(eq(logements.tenantId, tenantId), eq(logements.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }
}
