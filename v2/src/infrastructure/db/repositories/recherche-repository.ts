import { and, desc, eq, ilike, or } from "drizzle-orm";
import type {
  RechercheRepository,
  ResultatRecherche,
} from "@/application/ports/recherche-repository";
import { withTenant } from "../client";
import {
  commandesExtras,
  etatsDesLieux,
  factures,
  logements,
  menages,
  missions,
  objetsTrouves,
  paiements,
  reservations,
  sinistres,
  tickets,
} from "../schema";

function motifLike(q: string): string {
  return `%${q.replace(/[%_\\]/g, "\\$&")}%`;
}

function jour(valeur: Date | string | null): string | null {
  if (!valeur) return null;
  return typeof valeur === "string"
    ? valeur.slice(0, 10)
    : valeur.toISOString().slice(0, 10);
}

export class DrizzleRechercheRepository implements RechercheRepository {
  async chercher(
    tenantId: string,
    q: string,
    limite: number,
  ): Promise<ResultatRecherche[]> {
    const motif = motifLike(q);
    const parTable = Math.max(3, Math.min(limite, 10));

    return withTenant(tenantId, async (tx) => {
      const resultats: ResultatRecherche[] = [];

      const logementsTrouves = await tx
        .select()
        .from(logements)
        .where(
          and(
            eq(logements.tenantId, tenantId),
            or(ilike(logements.code, motif), ilike(logements.nom, motif)),
          ),
        )
        .limit(parTable);
      for (const row of logementsTrouves) {
        resultats.push({
          id: row.id,
          categorie: "logement",
          ref: row.code,
          titre: row.nom,
          detail: row.adresse ?? "Logement",
          date: null,
          href: `/hote/logements/${row.id}`,
        });
      }

      const reservationsTrouvees = await tx
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.tenantId, tenantId),
            or(
              ilike(reservations.ref, motif),
              ilike(reservations.clientNom, motif),
            ),
          ),
        )
        .orderBy(desc(reservations.debut))
        .limit(parTable);
      for (const row of reservationsTrouvees) {
        resultats.push({
          id: row.id,
          categorie: "reservation",
          ref: row.ref,
          titre: row.clientNom ?? "Séjour",
          detail: `${row.debut} → ${row.fin} · ${row.statut}`,
          date: row.debut,
          href: `/hote/planning?mois=${row.debut.slice(0, 7)}`,
        });
      }

      const facturesTrouvees = await tx
        .select()
        .from(factures)
        .where(
          and(
            eq(factures.tenantId, tenantId),
            or(ilike(factures.numero, motif), ilike(factures.clientNom, motif)),
          ),
        )
        .orderBy(desc(factures.dateEmission))
        .limit(parTable);
      for (const row of facturesTrouvees) {
        resultats.push({
          id: row.id,
          categorie: "facture",
          ref: row.numero,
          titre: row.clientNom,
          detail: `${row.statut} · ${row.dateEmission}`,
          date: row.dateEmission,
          href: `/hote/factures/${row.id}`,
        });
      }

      const paiementsTrouves = await tx
        .select()
        .from(paiements)
        .where(
          and(
            eq(paiements.tenantId, tenantId),
            or(
              ilike(paiements.ref, motif),
              ilike(paiements.reference, motif),
            ),
          ),
        )
        .orderBy(desc(paiements.datePaiement))
        .limit(parTable);
      for (const row of paiementsTrouves) {
        resultats.push({
          id: row.id,
          categorie: "paiement",
          ref: row.ref,
          titre: row.reference ?? "Paiement",
          detail: `${row.mode} · ${row.datePaiement}`,
          date: row.datePaiement,
          href: `/hote/factures/${row.factureId}`,
        });
      }

      const missionsTrouvees = await tx
        .select()
        .from(missions)
        .where(
          and(
            eq(missions.tenantId, tenantId),
            or(ilike(missions.ref, motif), ilike(missions.notes, motif)),
          ),
        )
        .orderBy(desc(missions.date))
        .limit(parTable);
      for (const row of missionsTrouvees) {
        resultats.push({
          id: row.id,
          categorie: "mission",
          ref: row.ref,
          titre: row.type,
          detail: `${row.date} · ${row.statut}`,
          date: row.date,
          href: "/hote/missions",
        });
      }

      const menagesTrouves = await tx
        .select()
        .from(menages)
        .where(
          and(eq(menages.tenantId, tenantId), ilike(menages.ref, motif)),
        )
        .orderBy(desc(menages.date))
        .limit(parTable);
      for (const row of menagesTrouves) {
        resultats.push({
          id: row.id,
          categorie: "menage",
          ref: row.ref,
          titre: "Ménage",
          detail: `${row.date} · ${row.statut}`,
          date: row.date,
          href: `/hote/menage/${row.id}`,
        });
      }

      const etatsTrouves = await tx
        .select()
        .from(etatsDesLieux)
        .where(
          and(
            eq(etatsDesLieux.tenantId, tenantId),
            ilike(etatsDesLieux.ref, motif),
          ),
        )
        .orderBy(desc(etatsDesLieux.date))
        .limit(parTable);
      for (const row of etatsTrouves) {
        resultats.push({
          id: row.id,
          categorie: "etat-des-lieux",
          ref: row.ref,
          titre: "État des lieux",
          detail: row.date,
          date: row.date,
          href: `/hote/etats-des-lieux/${row.id}`,
        });
      }

      const ticketsTrouves = await tx
        .select()
        .from(tickets)
        .where(
          and(
            eq(tickets.tenantId, tenantId),
            or(ilike(tickets.ref, motif), ilike(tickets.sujet, motif)),
          ),
        )
        .orderBy(desc(tickets.createdAt))
        .limit(parTable);
      for (const row of ticketsTrouves) {
        resultats.push({
          id: row.id,
          categorie: "ticket",
          ref: row.ref,
          titre: row.sujet,
          detail: row.statut,
          date: jour(row.createdAt),
          href: "/hote/messages",
        });
      }

      const sinistresTrouves = await tx
        .select()
        .from(sinistres)
        .where(
          and(
            eq(sinistres.tenantId, tenantId),
            or(
              ilike(sinistres.ref, motif),
              ilike(sinistres.description, motif),
            ),
          ),
        )
        .orderBy(desc(sinistres.date))
        .limit(parTable);
      for (const row of sinistresTrouves) {
        resultats.push({
          id: row.id,
          categorie: "sinistre",
          ref: row.ref,
          titre: row.description.slice(0, 100),
          detail: row.statut,
          date: row.date,
          href: "/hote/sinistres",
        });
      }

      const objets = await tx
        .select()
        .from(objetsTrouves)
        .where(
          and(
            eq(objetsTrouves.tenantId, tenantId),
            or(
              ilike(objetsTrouves.ref, motif),
              ilike(objetsTrouves.description, motif),
              ilike(objetsTrouves.voyageurNom, motif),
            ),
          ),
        )
        .orderBy(desc(objetsTrouves.trouveLe))
        .limit(parTable);
      for (const row of objets) {
        resultats.push({
          id: row.id,
          categorie: "objet-trouve",
          ref: row.ref,
          titre: row.description.slice(0, 100),
          detail: `${row.trouveLe} · ${row.statut}`,
          date: row.trouveLe,
          href: "/hote/objets-trouves",
        });
      }

      const commandesTrouvees = await tx
        .select()
        .from(commandesExtras)
        .where(
          and(
            eq(commandesExtras.tenantId, tenantId),
            ilike(commandesExtras.ref, motif),
          ),
        )
        .orderBy(desc(commandesExtras.createdAt))
        .limit(parTable);
      for (const row of commandesTrouvees) {
        resultats.push({
          id: row.id,
          categorie: "commande-extra",
          ref: row.ref,
          titre: "Commande extra",
          detail: row.statut,
          date: jour(row.createdAt),
          href: "/hote/extras",
        });
      }

      return resultats.slice(0, limite);
    });
  }
}
