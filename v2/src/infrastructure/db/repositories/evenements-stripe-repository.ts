import { and, count, desc, eq, lt, or, sql } from "drizzle-orm";
import type {
  CreerEvenementStripeData,
  EvenementStripeTrace,
  EvenementsStripeRepository,
  MarquerStatutEvenementStripeData,
  ResultatEnregistrementEvenementStripe,
} from "@/application/ports/evenements-stripe-repository";
import type { StatutEvenementStripe } from "@/domain/evenement-stripe";
import { db } from "../client";
import { evenementsStripe } from "../schema";

/** Un événement « recu » plus vieux que ce délai est un traitement interrompu. */
const DELAI_BLOCAGE_MINUTES = 10;

function versTrace(
  row: typeof evenementsStripe.$inferSelect,
): EvenementStripeTrace {
  return {
    id: row.id,
    evenementId: row.evenementId,
    type: row.type,
    objetId: row.objetId,
    statut: row.statut as StatutEvenementStripe,
    evenement: row.evenement,
    erreur: row.erreur,
    tentatives: row.tentatives,
    recuLe: row.recuLe,
    derniereTentativeLe: row.derniereTentativeLe,
    traiteLe: row.traiteLe,
    rejoueLe: row.rejoueLe,
  };
}

function conditionARejouer() {
  const seuil = sql`now() - make_interval(mins => ${DELAI_BLOCAGE_MINUTES})`;
  return or(
    eq(evenementsStripe.statut, "echec"),
    and(
      eq(evenementsStripe.statut, "recu"),
      lt(evenementsStripe.derniereTentativeLe, seuil),
    ),
  );
}

export class DrizzleEvenementsStripeRepository
  implements EvenementsStripeRepository
{
  async enregistrer(
    data: CreerEvenementStripeData,
  ): Promise<ResultatEnregistrementEvenementStripe> {
    const [cree] = await db
      .insert(evenementsStripe)
      .values({
        evenementId: data.evenementId,
        type: data.type,
        objetId: data.objetId ?? null,
        evenement: data.evenement,
        statut: "recu",
      })
      .onConflictDoNothing({ target: evenementsStripe.evenementId })
      .returning();
    if (cree) return { trace: versTrace(cree), cree: true };

    const [existant] = await db
      .select()
      .from(evenementsStripe)
      .where(eq(evenementsStripe.evenementId, data.evenementId))
      .limit(1);
    if (!existant) {
      throw new Error("Trace d'événement Stripe introuvable après conflit.");
    }
    return { trace: versTrace(existant), cree: false };
  }

  async trouverParEvenementId(
    evenementId: string,
  ): Promise<EvenementStripeTrace | null> {
    const [row] = await db
      .select()
      .from(evenementsStripe)
      .where(eq(evenementsStripe.evenementId, evenementId))
      .limit(1);
    return row ? versTrace(row) : null;
  }

  async marquerStatut(
    evenementId: string,
    data: MarquerStatutEvenementStripeData,
  ): Promise<EvenementStripeTrace | null> {
    const maintenant = new Date();
    const valeurs: Partial<typeof evenementsStripe.$inferInsert> = {
      statut: data.statut,
      derniereTentativeLe: maintenant,
    };
    if (data.erreur !== undefined) valeurs.erreur = data.erreur;
    if (data.statut === "traite" || data.statut === "ignore") {
      valeurs.traiteLe = maintenant;
      if (data.erreur === undefined) valeurs.erreur = null;
    }
    if (data.rejoue) valeurs.rejoueLe = maintenant;
    const [row] = await db
      .update(evenementsStripe)
      .set(
        data.retentative
          ? {
              ...valeurs,
              tentatives: sql`${evenementsStripe.tentatives} + 1`,
            }
          : valeurs,
      )
      .where(eq(evenementsStripe.evenementId, evenementId))
      .returning();
    return row ? versTrace(row) : null;
  }

  async listerRecents(limite: number): Promise<EvenementStripeTrace[]> {
    const rows = await db
      .select()
      .from(evenementsStripe)
      .orderBy(desc(evenementsStripe.recuLe))
      .limit(Math.max(1, Math.min(limite, 200)));
    return rows.map(versTrace);
  }

  async listerEchoues(limite: number): Promise<EvenementStripeTrace[]> {
    const rows = await db
      .select()
      .from(evenementsStripe)
      .where(conditionARejouer())
      .orderBy(desc(evenementsStripe.recuLe))
      .limit(Math.max(1, Math.min(limite, 200)));
    return rows.map(versTrace);
  }

  async compterEchoues(): Promise<number> {
    const [row] = await db
      .select({ n: count() })
      .from(evenementsStripe)
      .where(conditionARejouer());
    return Number(row?.n ?? 0);
  }
}
