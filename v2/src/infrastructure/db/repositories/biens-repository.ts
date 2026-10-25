import { and, asc, eq, sql } from "drizzle-orm";
import type {
  BiensRepository,
  EvenementBien,
} from "@/application/ports/biens-repository";
import type { Bien, BienInput } from "@/domain/inventaire";
import { withTenant } from "../client";
import { bienEvenements, biens } from "../schema";

function versDomaine(row: typeof biens.$inferSelect): Bien {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    qr: row.qr,
    categorie: row.categorie,
    label: row.label,
    dateAchat: row.dateAchat,
    prixAchatCentimes: row.prixAchatCentimes,
    fournisseur: row.fournisseur,
    garantieFin: row.garantieFin,
    lavagesNb: row.lavagesNb,
    utilisationsNb: row.utilisationsNb,
    derniereUtilisation: row.derniereUtilisation,
    etat: row.etat as Bien["etat"],
    photoUrl: row.photoUrl,
    notes: row.notes,
  };
}

export class DrizzleBiensRepository implements BiensRepository {
  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<Bien[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(biens)
        .where(
          and(eq(biens.tenantId, tenantId), eq(biens.logementId, logementId)),
        )
        .orderBy(asc(biens.categorie), asc(biens.label));
      return rows.map(versDomaine);
    });
  }

  async trouverParQr(
    tenantId: string,
    logementId: string,
    qr: string,
  ): Promise<Bien | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(biens)
        .where(
          and(
            eq(biens.tenantId, tenantId),
            eq(biens.logementId, logementId),
            eq(biens.qr, qr),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async enregistrer(input: BienInput): Promise<Bien> {
    return withTenant(input.tenantId, async (tx) => {
      const [row] = await tx
        .insert(biens)
        .values({
          ...(input.id ? { id: input.id } : {}),
          tenantId: input.tenantId,
          logementId: input.logementId,
          qr: input.qr,
          categorie: input.categorie,
          label: input.label,
          dateAchat: input.dateAchat,
          prixAchatCentimes: input.prixAchatCentimes,
          fournisseur: input.fournisseur,
          garantieFin: input.garantieFin,
          etat: input.etat,
          photoUrl: input.photoUrl,
          notes: input.notes,
        })
        .onConflictDoUpdate({
          target: [biens.tenantId, biens.logementId, biens.qr],
          set: {
            categorie: input.categorie,
            label: input.label,
            dateAchat: input.dateAchat,
            prixAchatCentimes: input.prixAchatCentimes,
            fournisseur: input.fournisseur,
            garantieFin: input.garantieFin,
            etat: input.etat,
            photoUrl: input.photoUrl,
            notes: input.notes,
            updatedAt: new Date(),
          },
        })
        .returning();
      if (!row) throw new Error("Bien : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async enregistrerUtilisation(
    tenantId: string,
    id: string,
    laver: boolean,
    date: string,
  ): Promise<Bien> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(biens)
        .set({
          utilisationsNb: sql`${biens.utilisationsNb} + 1`,
          lavagesNb: laver
            ? sql`${biens.lavagesNb} + 1`
            : biens.lavagesNb,
          derniereUtilisation: date,
          updatedAt: new Date(),
        })
        .where(and(eq(biens.tenantId, tenantId), eq(biens.id, id)))
        .returning();
      if (!row) throw new Error("Bien introuvable.");
      return versDomaine(row);
    });
  }

  async changerEtat(
    tenantId: string,
    id: string,
    etat: Bien["etat"],
    notes: string | null,
  ): Promise<Bien> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(biens)
        .set({ etat, ...(notes !== null ? { notes } : {}), updatedAt: new Date() })
        .where(and(eq(biens.tenantId, tenantId), eq(biens.id, id)))
        .returning();
      if (!row) throw new Error("Bien introuvable.");
      return versDomaine(row);
    });
  }

  async evenementExiste(tenantId: string, ref: string): Promise<boolean> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select({ id: bienEvenements.id })
        .from(bienEvenements)
        .where(
          and(
            eq(bienEvenements.tenantId, tenantId),
            eq(bienEvenements.ref, ref),
          ),
        )
        .limit(1);
      return Boolean(row);
    });
  }

  async enregistrerEvenement(evenement: EvenementBien): Promise<void> {
    await withTenant(evenement.tenantId, async (tx) => {
      await tx
        .insert(bienEvenements)
        .values({
          tenantId: evenement.tenantId,
          logementId: evenement.logementId,
          bienId: evenement.bienId,
          type: evenement.type,
          ref: evenement.ref,
          payload: evenement.payload,
        })
        .onConflictDoNothing({
          target: [bienEvenements.tenantId, bienEvenements.ref],
        });
    });
  }
}
