import { isRedirect, redirect } from "@sveltejs/kit";
import { ChangerStatutCommandeExtra } from "@/application/use-cases/changer-statut-commande-extra";
import { CreerExtra } from "@/application/use-cases/creer-extra";
import { ErreurMetier } from "@/domain/erreurs";
import {
  TRANSITIONS_COMMANDE_EXTRA,
  type StatutCommandeExtra,
} from "@/domain/extra";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleCommandeExtraRepository } from "@/infrastructure/db/repositories/commande-extra-repository";
import { DrizzleExtraRepository } from "@/infrastructure/db/repositories/extra-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie, formaterEuros } from "@/lib/format";
import { traductionsExtras } from "@/lib/i18n-extras";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const STATUTS: StatutCommandeExtra[] = [
  "demandee",
  "confirmee",
  "refusee",
  "livree",
];

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function retour(suffixe: string): never {
  redirect(303, `/hote/extras?${suffixe}`);
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const [extras, logements, commandes, reservations] = await Promise.all([
    new DrizzleExtraRepository().listerTous(tenantId),
    new DrizzleLogementRepository().listerParTenant(tenantId),
    new DrizzleCommandeExtraRepository().listerParTenant(tenantId),
    new DrizzleReservationRepository().listerTous(tenantId),
  ]);

  const parExtra = new Map(extras.map((extra) => [extra.id, extra]));
  const parLogement = new Map(logements.map((logement) => [logement.id, logement]));
  const parReservation = new Map(
    reservations.map((reservation) => [reservation.id, reservation]),
  );

  return {
    logements: logements.map((logement) => ({
      id: logement.id,
      nom: logement.nom,
      code: logement.code,
    })),
    extras: extras.map((extra) => ({
      id: extra.id,
      code: extra.code,
      nom: extra.nom,
      description: extra.description,
      prix: formaterEuros(extra.prixCentimes),
      actif: extra.actif,
      logement: extra.logementId
        ? (parLogement.get(extra.logementId)?.nom ?? extra.logementId)
        : null,
    })),
    commandes: commandes.map((commande) => ({
      id: commande.id,
      ref: commande.ref,
      extra: parExtra.get(commande.extraId)?.nom ?? commande.extraId,
      quantite: commande.quantite,
      total: formaterEuros(commande.totalCentimes),
      reservation:
        parReservation.get(commande.reservationId)?.ref ??
        commande.reservationId,
      statut: commande.statut,
      transitions: TRANSITIONS_COMMANDE_EXTRA[commande.statut],
    })),
    langue: event.cookies.get("lcd_langue") ?? "fr",
    ok: event.url.searchParams.get("ok"),
    okNom: event.url.searchParams.get("nom"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  creer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const prixCentimes = centimesDepuisSaisie(texte(donnees, "prixEuros"));
    const extraNom = texte(donnees, "nom");

    if (prixCentimes === null) {
      retour("erreur=prix");
    }

    try {
      const logementId = texte(donnees, "logementId") || null;
      if (logementId) {
        const logement = await new DrizzleLogementRepository().trouverParId(
          tenantId,
          logementId,
        );
        if (!logement) retour("erreur=logement");
      }

      const extra = await new CreerExtra(new DrizzleExtraRepository()).executer({
        tenantId,
        logementId,
        code: texte(donnees, "code"),
        nom: extraNom,
        description: texte(donnees, "description"),
        prixCentimes,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "extra.creer",
          cible: extra.id,
          ref: extra.code,
          payload: { prixCentimes: extra.prixCentimes },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(`erreur=${encodeURIComponent(error.message)}`);
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        retour("erreur=code-existant");
      }
      logErreur("extras.creer", error, { tenantId });
      retour("erreur=inattendu");
    }

    retour(`ok=cree&nom=${encodeURIComponent(extraNom)}`);
  },

  statut: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const commandeId = texte(donnees, "commandeId");
    const statut = texte(donnees, "statut") as StatutCommandeExtra;

    if (!commandeId || !STATUTS.includes(statut)) {
      retour("erreur=statut");
    }

    try {
      const commande = await new ChangerStatutCommandeExtra(
        new DrizzleCommandeExtraRepository(),
      ).executer({ tenantId, commandeId, statut });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "commande_extra.statut",
          cible: commande.id,
          ref: commande.ref,
          payload: { statut: commande.statut },
        }),
      );
    } catch (error) {
      if (error instanceof ErreurMetier) {
        retour(`erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("extras.statut", error, { tenantId, commandeId });
      retour("erreur=inattendu");
    }

    retour("ok=statut");
  },
} satisfies Actions;
