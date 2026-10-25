import { and, asc, eq } from "drizzle-orm";
import type {
  EnregistrerPhraseData,
  MettreAJourPhraseData,
  PhrasesRepository,
} from "@/application/ports/phrases-repository";
import type { CategoriePhrase, Phrase } from "@/domain/phrase";
import { withTenant } from "../client";
import { phrases } from "../schema";

function versDomaine(row: typeof phrases.$inferSelect): Phrase {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    ref: row.ref,
    categorie: row.categorie as CategoriePhrase,
    titre: row.titre,
    contenu: row.contenu,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzlePhrasesRepository implements PhrasesRepository {
  async enregistrer(data: EnregistrerPhraseData): Promise<Phrase> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(phrases)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          ref: data.ref,
          categorie: data.categorie,
          titre: data.titre,
          contenu: data.contenu,
        })
        .onConflictDoUpdate({
          target: [phrases.tenantId, phrases.ref],
          set: {
            categorie: data.categorie,
            titre: data.titre,
            contenu: data.contenu,
            updatedAt: new Date(),
          },
        })
        .returning();
      if (!row) throw new Error("Phrase : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async mettreAJour(
    tenantId: string,
    id: string,
    data: MettreAJourPhraseData,
  ): Promise<Phrase | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(phrases)
        .set({
          categorie: data.categorie,
          titre: data.titre,
          contenu: data.contenu,
          updatedAt: new Date(),
        })
        .where(and(eq(phrases.tenantId, tenantId), eq(phrases.id, id)))
        .returning();
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<Phrase | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(phrases)
        .where(and(eq(phrases.tenantId, tenantId), eq(phrases.ref, ref)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParId(tenantId: string, id: string): Promise<Phrase | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(phrases)
        .where(and(eq(phrases.tenantId, tenantId), eq(phrases.id, id)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<Phrase[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(phrases)
        .where(
          and(
            eq(phrases.tenantId, tenantId),
            eq(phrases.logementId, logementId),
          ),
        )
        .orderBy(asc(phrases.categorie), asc(phrases.titre));
      return rows.map(versDomaine);
    });
  }

  async supprimer(tenantId: string, id: string): Promise<void> {
    await withTenant(tenantId, (tx) =>
      tx
        .delete(phrases)
        .where(and(eq(phrases.tenantId, tenantId), eq(phrases.id, id))),
    );
  }
}
