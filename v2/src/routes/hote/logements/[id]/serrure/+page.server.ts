/**
 * T607 — Écran staff des codes d'accès d'un logement.
 *
 * Liste les accès (code, fenêtre `valideDe`/`valideA`, statut, fournisseur) et
 * permet deux gestes, tous deux tracés dans `auditLogs` :
 * - « créer un code » pour une réservation (dates dérivées) ou une plage
 *   manuelle, via le use case `creer-acces-serrure.ts` — idempotent par `ref`,
 *   avec repli manuel si la serrure connectée n'est pas configurée ;
 * - « révoquer » avec motif obligatoire (≥ 10 caractères), via le domaine
 *   (`revoquerAcces`) puis `AccesSerrureRepository.revoquer`.
 *
 * Révocation côté fournisseur : aucun identifiant de serrure n'est persisté
 * (pas de colonne `serrure_id`) — la révocation est donc locale au produit.
 * Le code Nuki, lui, cesse d'être valable à la fin de sa fenêtre.
 */
import { error, fail } from "@sveltejs/kit";
import { CreerAccesSerrure } from "@/application/use-cases/creer-acces-serrure";
import {
  libelleFournisseurSerrure,
  revoquerAcces,
  type CodeAcces,
  type FournisseurSerrure,
  type StatutAcces,
} from "@/domain/acces-serrure";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleAccesSerrureRepository } from "@/infrastructure/db/repositories/guides-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { creerSerrureNuki } from "@/infrastructure/adapters/serrures/nuki";
import { jourParis } from "@/lib/date-paris";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

/** Longueur minimale du motif de révocation (action tracée). */
const MOTIF_REVOCATION_MIN = 10;

const LIBELLES_STATUT: Record<StatutAcces, string> = {
  actif: "Actif",
  revoque: "Révoqué",
  expire: "Expiré",
};

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function formaterInstant(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

/**
 * Projette une ligne de persistance vers le type du domaine : `revoquerAcces`
 * porte la règle « pas de double révocation », on la réutilise plutôt que de la
 * réécrire dans la route.
 */
function enCodeAcces(row: {
  id: string;
  ref: string;
  logementId: string;
  reservationId: string | null;
  code: string | null;
  fournisseur: string | null;
  statut: StatutAcces;
  valideDe: string;
  valideA: string;
  revoqueLe: string | null;
  revoquePar: string | null;
  externalId: string | null;
}): CodeAcces {
  return {
    id: row.id,
    ref: row.ref,
    logementId: row.logementId,
    reservationId: row.reservationId,
    code: row.code ?? "",
    fournisseur: (row.fournisseur ?? "manuel") as FournisseurSerrure,
    statut: row.statut,
    valideDe: row.valideDe,
    valideA: row.valideA,
    creeLe: row.valideDe,
    revoqueLe: row.revoqueLe,
    revoquePar: row.revoquePar,
    externalId: row.externalId,
  };
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logement = await new DrizzleLogementRepository().trouverParId(
    tenantId,
    event.params.id,
  );
  if (!logement) error(404, "Logement introuvable");

  const aujourdhui = jourParis();
  const [acces, reservations] = await Promise.all([
    new DrizzleAccesSerrureRepository().listerParLogement(
      tenantId,
      logement.id,
    ),
    new DrizzleReservationRepository().listerTous(tenantId),
  ]);

  const aVenir = reservations
    .filter(
      (reservation) =>
        reservation.logementId === logement.id &&
        reservation.statut !== "annulee" &&
        reservation.fin >= aujourdhui,
    )
    .sort((a, b) => a.debut.localeCompare(b.debut));

  const serrureDisponible = creerSerrureNuki().estDisponible();

  return {
    logement: { id: logement.id, code: logement.code, nom: logement.nom },
    serrureDisponible,
    acces: acces
      .slice()
      .sort((a, b) => b.valideDe.localeCompare(a.valideDe))
      .map((row) => ({
        id: row.id,
        ref: row.ref,
        code: row.code ?? "—",
        type: row.type,
        statut: row.statut,
        libelleStatut: LIBELLES_STATUT[row.statut] ?? row.statut,
        fournisseur:
          row.fournisseur === "nuki"
            ? libelleFournisseurSerrure("nuki")
            : libelleFournisseurSerrure("manuel"),
        valideDe: formaterInstant(row.valideDe),
        valideA: formaterInstant(row.valideA),
        revoqueLe: formaterInstant(row.revoqueLe),
        revoquePar: row.revoquePar,
        reservationId: row.reservationId,
      })),
    reservations: aVenir.map((reservation) => ({
      id: reservation.id,
      ref: reservation.ref,
      clientNom: reservation.clientNom ?? "Voyageur",
      debut: reservation.debut,
      fin: reservation.fin,
      statut: reservation.statut,
      aUnCode: acces.some(
        (row) => row.reservationId === reservation.id && row.statut === "actif",
      ),
    })),
  };
};

export const actions: Actions = {
  /** T607 — Prépare un code pour une réservation ou une plage libre. */
  creer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const reservationId = texte(donnees, "reservationId") || null;
    const serrureId = texte(donnees, "serrureId") || null;

    try {
      // Une réservation fournit ses dates : le client n'impose jamais la
      // fenêtre d'accès d'une réservation existante.
      let arrivee = texte(donnees, "arrivee");
      let depart = texte(donnees, "depart");
      if (reservationId) {
        const reservation =
          await new DrizzleReservationRepository().trouverParId(
            tenantId,
            reservationId,
          );
        if (!reservation || reservation.logementId !== logementId) {
          return fail(400, {
            ok: false,
            message: "Réservation introuvable pour ce logement.",
          });
        }
        arrivee = reservation.debut;
        depart = reservation.fin;
      }
      if (!arrivee || !depart) {
        return fail(400, {
          ok: false,
          message: "Indiquez une réservation ou une plage de dates.",
        });
      }

      const creer = new CreerAccesSerrure(
        new DrizzleAccesSerrureRepository(),
        creerSerrureNuki(),
      );
      const acces = await creer.executer({
        tenantId,
        logementId,
        reservationId,
        arrivee,
        depart,
        serrureId,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email ?? "staff",
          action: "serrure.code_creer",
          cible: acces.ref,
          ref: acces.ref,
          payload: {
            logementId,
            reservationId,
            fournisseur: acces.fournisseur,
            existant: acces.existant,
            repli: acces.fallback,
          },
        }),
      );

      return {
        ok: true,
        message: acces.existant
          ? `Code ${acces.code} déjà programmé pour cette période.`
          : acces.fallback
            ? `Code manuel ${acces.code} préparé (serrure indisponible).`
            : `Code ${acces.code} programmé sur la serrure.`,
      };
    } catch (erreur) {
      if (erreur instanceof ErreurMetier) {
        return fail(400, { ok: false, message: erreur.message });
      }
      logErreur("serrure.creer", erreur, { tenantId, logementId });
      return fail(500, {
        ok: false,
        message: "La création du code a échoué.",
      });
    }
  },

  /** T607 — Révoque un code avec un motif tracé. */
  revoquer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const accesId = texte(donnees, "accesId");
    const motif = texte(donnees, "motif");

    if (motif.length < MOTIF_REVOCATION_MIN) {
      return fail(400, {
        ok: false,
        message: `Un motif de révocation d'au moins ${MOTIF_REVOCATION_MIN} caractères est requis.`,
      });
    }

    const depot = new DrizzleAccesSerrureRepository();
    const existant = await depot.trouverParId(tenantId, accesId);
    if (!existant) {
      return fail(404, { ok: false, message: "Code d'accès introuvable." });
    }

    try {
      // Le domaine décide : un accès déjà révoqué lève `ACCES_INVALIDE`.
      revoquerAcces(enCodeAcces(existant), {
        par: session.user.email ?? "staff",
        motif,
      });

      const revoque = await depot.revoquer(tenantId, accesId, {
        par: session.user.email ?? "staff",
      });
      if (!revoque) {
        return fail(404, { ok: false, message: "Code d'accès introuvable." });
      }

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email ?? "staff",
          action: "serrure.code_revoquer",
          cible: existant.ref,
          ref: existant.ref,
          payload: {
            logementId: existant.logementId,
            reservationId: existant.reservationId,
            motif,
          },
        }),
      );

      return { ok: true, message: `Code ${existant.code ?? ""} révoqué.` };
    } catch (erreur) {
      if (erreur instanceof ErreurMetier) {
        return fail(400, { ok: false, message: erreur.message });
      }
      logErreur("serrure.revoquer", erreur, { tenantId, accesId });
      return fail(500, {
        ok: false,
        message: "La révocation a échoué.",
      });
    }
  },
};
