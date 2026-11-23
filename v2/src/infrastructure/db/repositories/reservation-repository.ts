import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  ne,
  or,
  type SQL,
} from "drizzle-orm";
import type {
  CreerReservationData,
  FiltreReservations,
  OptionsListeReservations,
  ReservationRepository,
} from "@/application/ports/reservation-repository";
import type {
  MiseAJourReservationFournisseurData,
  ReservationFournisseurRepository,
} from "@/application/ports/reservation-fournisseur-repository";
import type { Reservation } from "@/domain/reservation";
import { withTenant } from "../client";
import { logements, reservations } from "../schema";

function versDomaine(row: typeof reservations.$inferSelect): Reservation {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    ref: row.ref,
    clientNom: row.clientNom,
    clientEmail: row.clientEmail,
    voyageurs: row.voyageurs,
    debut: row.debut,
    fin: row.fin,
    statut: row.statut as Reservation["statut"],
    montantCentimes: row.montantCentimes,
    source: row.source,
    fluxIcsId: row.fluxIcsId,
    departConfirmeLe: row.departConfirmeLe,
    departNote: row.departNote,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function conditionsFiltre(
  tenantId: string,
  filtre: FiltreReservations | undefined,
): SQL[] {
  const conditions: SQL[] = [eq(reservations.tenantId, tenantId)];
  if (!filtre) return conditions;
  if (filtre.logementId)
    conditions.push(eq(reservations.logementId, filtre.logementId));
  if (filtre.periode) {
    conditions.push(lt(reservations.debut, filtre.periode.fin));
    conditions.push(gt(reservations.fin, filtre.periode.debut));
  }
  if (filtre.finMin) conditions.push(gte(reservations.fin, filtre.finMin));
  if (filtre.debutMax)
    conditions.push(lte(reservations.debut, filtre.debutMax));
  if (filtre.statut) conditions.push(eq(reservations.statut, filtre.statut));
  if (filtre.recherche?.trim()) {
    const like = `%${filtre.recherche.trim()}%`;
    const clause = or(
      ilike(reservations.ref, like),
      ilike(reservations.clientNom, like),
      ilike(reservations.clientEmail, like),
    );
    if (clause) conditions.push(clause);
  }
  return conditions;
}

function conditionRecherche(terme: string): SQL | undefined {
  const q = terme.trim();
  if (!q) return undefined;
  const like = `%${q}%`;
  return or(
    ilike(reservations.ref, like),
    ilike(reservations.clientNom, like),
    ilike(reservations.clientEmail, like),
    ilike(logements.nom, like),
  );
}

function ordreReservation(
  ordre: OptionsListeReservations["ordre"],
): ReturnType<typeof asc> | ReturnType<typeof desc> {
  if (ordre === "debut-desc") return desc(reservations.debut);
  if (ordre === "fin-asc") return asc(reservations.fin);
  return asc(reservations.debut);
}

export class DrizzleReservationRepository
  implements ReservationRepository, ReservationFournisseurRepository
{
  async creer(data: CreerReservationData): Promise<Reservation> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(reservations)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          ref: data.ref,
          clientNom: data.clientNom,
          clientEmail: data.clientEmail,
          voyageurs: data.voyageurs,
          debut: data.debut,
          fin: data.fin,
          montantCentimes: data.montantCentimes,
          source: data.source ?? "direct",
          statut: data.statut ?? "brouillon",
        })
        .returning();

      if (!row) throw new Error("Réservation : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Reservation[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.tenantId, tenantId),
            lt(reservations.debut, fin),
            gt(reservations.fin, debut),
          ),
        )
        .orderBy(asc(reservations.debut));
      return rows.map(versDomaine);
    });
  }

  async listerPage(
    tenantId: string,
    options: OptionsListeReservations,
  ): Promise<Reservation[]> {
    const limite = Math.max(1, Math.min(200, Math.trunc(options.limite)));
    const decalage = Math.max(0, Math.trunc(options.decalage));
    const recherche = options.recherche?.trim();
    return withTenant(tenantId, async (tx) => {
      const conditions = conditionsFiltre(tenantId, options);
      if (recherche) {
        const clause = conditionRecherche(recherche);
        if (clause) conditions.push(clause);
        const rows = await tx
          .select({ reservation: reservations })
          .from(reservations)
          .innerJoin(logements, eq(logements.id, reservations.logementId))
          .where(and(...conditions))
          .orderBy(ordreReservation(options.ordre))
          .limit(limite)
          .offset(decalage);
        return rows.map((row) => versDomaine(row.reservation));
      }
      const rows = await tx
        .select()
        .from(reservations)
        .where(and(...conditions))
        .orderBy(ordreReservation(options.ordre))
        .limit(limite)
        .offset(decalage);
      return rows.map(versDomaine);
    });
  }

  async compter(
    tenantId: string,
    filtre: FiltreReservations = {},
  ): Promise<number> {
    const recherche = filtre.recherche?.trim();
    return withTenant(tenantId, async (tx) => {
      const conditions = conditionsFiltre(tenantId, filtre);
      if (recherche) {
        const clause = conditionRecherche(recherche);
        if (clause) conditions.push(clause);
        const [row] = await tx
          .select({ nombre: count() })
          .from(reservations)
          .innerJoin(logements, eq(logements.id, reservations.logementId))
          .where(and(...conditions));
        return Number(row?.nombre ?? 0);
      }
      const [row] = await tx
        .select({ nombre: count() })
        .from(reservations)
        .where(and(...conditions));
      return Number(row?.nombre ?? 0);
    });
  }

  async rechercher(
    tenantId: string,
    terme: string,
    limite: number,
  ): Promise<Reservation[]> {
    const borne = Math.max(1, Math.min(50, Math.trunc(limite)));
    return withTenant(tenantId, async (tx) => {
      const recherche = conditionRecherche(terme);
      if (!recherche) return [];
      const rows = await tx
        .select({ reservation: reservations })
        .from(reservations)
        .innerJoin(logements, eq(logements.id, reservations.logementId))
        .where(and(eq(reservations.tenantId, tenantId), recherche))
        .orderBy(asc(reservations.debut))
        .limit(borne);
      return rows.map((row) => versDomaine(row.reservation));
    });
  }

  async listerParIds(
    tenantId: string,
    ids: readonly string[],
  ): Promise<Reservation[]> {
    if (ids.length === 0) return [];
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.tenantId, tenantId),
            inArray(reservations.id, [...ids]),
          ),
        );
      return rows.map(versDomaine);
    });
  }

  async chevauche(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<boolean> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select({ id: reservations.id })
        .from(reservations)
        .where(
          and(
            eq(reservations.tenantId, tenantId),
            eq(reservations.logementId, logementId),
            lt(reservations.debut, fin),
            gt(reservations.fin, debut),
          ),
        )
        .limit(1);
      return Boolean(row);
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Reservation | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.tenantId, tenantId),
            eq(reservations.id, id),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerTous(tenantId: string): Promise<Reservation[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(reservations)
        .where(eq(reservations.tenantId, tenantId))
        .orderBy(asc(reservations.debut));
      return rows.map(versDomaine);
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<Reservation | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(reservations)
        .where(
          and(eq(reservations.tenantId, tenantId), eq(reservations.ref, ref)),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParReference(
    tenantId: string,
    logementId: string,
    reference: string,
  ): Promise<Reservation | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.tenantId, tenantId),
            eq(reservations.logementId, logementId),
            eq(reservations.ref, reference),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerChevauchements(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<Reservation[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.tenantId, tenantId),
            eq(reservations.logementId, logementId),
            ne(reservations.statut, "annulee"),
            lt(reservations.debut, fin),
            gt(reservations.fin, debut),
          ),
        );
      return rows.map(versDomaine);
    });
  }

  async mettreAJour(
    tenantId: string,
    id: string,
    data: MiseAJourReservationFournisseurData,
  ): Promise<Reservation> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(reservations)
        .set({
          debut: data.debut,
          fin: data.fin,
          clientNom: data.clientNom,
          clientEmail: data.clientEmail,
          montantCentimes: data.montantCentimes,
          statut: data.statut,
          updatedAt: new Date(),
        })
        .where(
          and(eq(reservations.tenantId, tenantId), eq(reservations.id, id)),
        )
        .returning();
      if (!row) throw new Error("Réservation fournisseur introuvable.");
      return versDomaine(row);
    });
  }

  async confirmerDepart(
    tenantId: string,
    id: string,
    note: string | null,
  ): Promise<Reservation | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(reservations)
        .set({
          departConfirmeLe: new Date(),
          departNote: note,
          updatedAt: new Date(),
        })
        .where(
          and(eq(reservations.tenantId, tenantId), eq(reservations.id, id)),
        )
        .returning();
      return row ? versDomaine(row) : null;
    });
  }

  async annuler(tenantId: string, id: string): Promise<Reservation | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(reservations)
        .set({ statut: "annulee", updatedAt: new Date() })
        .where(
          and(eq(reservations.tenantId, tenantId), eq(reservations.id, id)),
        )
        .returning();
      return row ? versDomaine(row) : null;
    });
  }
}
