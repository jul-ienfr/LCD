import { isRedirect, redirect } from "@sveltejs/kit";
import { ChangerStatutCaution } from "@/application/use-cases/changer-statut-caution";
import { CreerCaution } from "@/application/use-cases/creer-caution";
import {
  ajouterJours,
  decalerMois,
  joursDuMois,
  moisCourant,
  moisValide,
} from "@/domain/calendrier";
import {
  LIBELLES_STATUT_CAUTION,
  type StatutCaution,
} from "@/domain/caution";
import { ErreurMetier } from "@/domain/erreurs";
import {
  SEUIL_VALIDATION_CAUTION_CENTIMES,
  validationRequise,
} from "@/domain/validation-sensible";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleCautionRepository } from "@/infrastructure/db/repositories/caution-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleValidationSensibleRepository } from "@/infrastructure/db/repositories/validation-sensible-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie, formaterEuros } from "@/lib/format";
import { logErreur } from "@/lib/logger";
import {
  estSuperAdmin,
  requireRole,
  tenantIdDeSession,
} from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const STATUTS: StatutCaution[] = ["recue", "restituee", "retenue"];

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function retour(mois: string, suffixe: string): never {
  redirect(303, `/hote/cautions?mois=${encodeURIComponent(mois)}&caution=${suffixe}`);
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);
  const moisParam = event.url.searchParams.get("mois");
  const mois = moisParam && moisValide(moisParam) ? moisParam : moisCourant();
  const jours = joursDuMois(mois);
  const premier = jours[0]!;
  const dernier = jours[jours.length - 1]!;

  const [reservations, toutesCautions] = await Promise.all([
    new DrizzleReservationRepository().listerParMois(
      tenantId,
      premier,
      ajouterJours(dernier, 1),
    ),
    new DrizzleCautionRepository().listerParTenant(tenantId),
  ]);
  const peutValider =
    ["admin", "comptable"].includes(session.user.role ?? "") ||
    estSuperAdmin(session);
  const validations = peutValider
    ? await new DrizzleValidationSensibleRepository().listerParTypes(tenantId, [
        "caution_retenue",
      ])
    : [];
  const nomsReservations = new Map(
    reservations.map((reservation) => [reservation.id, reservation.ref]),
  );
  const refParCaution = new Map(
    toutesCautions.map((caution) => [
      caution.id,
      nomsReservations.get(caution.reservationId) ?? caution.reservationId,
    ]),
  );

  const ids = new Set(reservations.map((reservation) => reservation.id));
  const cautions = toutesCautions.filter((caution) => ids.has(caution.reservationId));
  const parReservation = new Map(cautions.map((caution) => [caution.reservationId, caution]));

  const langue = event.cookies.get("lcd_langue") ?? "fr";
  const moisLibelle = new Intl.DateTimeFormat(langue === "fr" ? "fr-FR" : langue, {
    month: "long",
    year: "numeric",
  }).format(new Date(`${mois}-01T12:00:00Z`));

  return {
    langue,
    mois,
    moisLibelle,
    precedent: `/hote/cautions?mois=${decalerMois(mois, -1)}`,
    suivant: `/hote/cautions?mois=${decalerMois(mois, 1)}`,
    courant: `/hote/cautions?mois=${moisCourant()}`,
    reservations: reservations.map((reservation) => {
      const caution = parReservation.get(reservation.id);
      return {
        id: reservation.id,
        ref: reservation.ref,
        client: reservation.clientNom,
        debut: reservation.debut,
        fin: reservation.fin,
        caution: caution
          ? {
              id: caution.id,
              montant: formaterEuros(caution.montantCentimes),
              statut: caution.statut,
              libelle: LIBELLES_STATUT_CAUTION[caution.statut],
              dateReception: caution.dateReception,
              dateRestitution: caution.dateRestitution,
              montantRetenu:
                caution.montantRetenuCentimes > 0
                  ? formaterEuros(caution.montantRetenuCentimes)
                  : null,
              motif: caution.motifRetenue,
            }
          : null,
      };
    }),
    sansCaution: reservations
      .filter((reservation) => !parReservation.has(reservation.id))
      .map((reservation) => ({
        id: reservation.id,
        ref: reservation.ref,
        debut: reservation.debut,
        fin: reservation.fin,
      })),
    totalCaution: formaterEuros(cautions.reduce((total, caution) => total + caution.montantCentimes, 0)),
    totalRetenu: formaterEuros(
      cautions.reduce((total, caution) => total + caution.montantRetenuCentimes, 0),
    ),
    caution: event.url.searchParams.get("caution"),
    validation: event.url.searchParams.get("validation"),
    peutValider,
    seuilValidation: formaterEuros(SEUIL_VALIDATION_CAUTION_CENTIMES),
    validations: validations.map((entree) => ({
      id: entree.id,
      ref: entree.ref,
      reservation: refParCaution.get(entree.cibleId) ?? entree.ref,
      montant: formaterEuros(entree.montantCentimes),
      demandeur: entree.demandeurEmail,
      demandeLe: entree.createdAt.toISOString().slice(0, 16).replace("T", " "),
      motif:
        typeof entree.payload.motifRetenue === "string"
          ? entree.payload.motifRetenue
          : null,
      soi: entree.demandeurId === session.user.id,
    })),
  };
};

export const actions = {
  creer: async (event) => {
    const session = requireRole(event, ["admin", "hote", "comptable"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const mois = texte(donnees, "mois");
    const montantCentimes = centimesDepuisSaisie(texte(donnees, "montantEuros"));

    if (montantCentimes === null || montantCentimes <= 0) {
      retour(mois, "erreur");
    }

    try {
      const resultat = await new CreerCaution(
        new DrizzleCautionRepository(),
        new DrizzleReservationRepository(),
      ).executer({
        tenantId,
        reservationId: texte(donnees, "reservationId"),
        montantCentimes,
        notes: texte(donnees, "notes"),
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "caution.creer",
          cible: resultat.caution.id,
          ref: resultat.caution.reservationId,
          payload: { montantCentimes },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) retour(mois, "erreur");
      logErreur("cautions.creer", error, { tenantId });
      retour(mois, "erreur");
    }

    retour(mois, "creee");
  },

  statut: async (event) => {
    const session = requireRole(event, ["admin", "hote", "comptable"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const mois = texte(donnees, "mois");
    const cautionId = texte(donnees, "cautionId");
    const statut = texte(donnees, "statut") as StatutCaution;

    if (!cautionId || !STATUTS.includes(statut)) retour(mois, "erreur");

    const montantRetenuCentimes = donnees.get("montantRetenuEuros")
      ? (centimesDepuisSaisie(texte(donnees, "montantRetenuEuros")) ?? 0)
      : 0;

    try {
      if (
        statut === "retenue" &&
        validationRequise("caution_retenue", montantRetenuCentimes)
      ) {
        const repo = new DrizzleValidationSensibleRepository();
        const existante = await repo.trouverEnAttente(
          tenantId,
          "caution_retenue",
          cautionId,
        );
        if (existante) {
          redirect(303, `/hote/cautions?mois=${encodeURIComponent(mois)}&validation=en_attente`);
        }
        const cautionAvant = await new DrizzleCautionRepository().trouverParId(
          tenantId,
          cautionId,
        );
        if (!cautionAvant) throw new ErreurMetier("CAUTION_INVALIDE", "Caution introuvable.");
        await repo.creer({
          tenantId,
          type: "caution_retenue",
          cibleId: cautionId,
          ref: cautionAvant.reservationId,
          montantCentimes: montantRetenuCentimes,
          payload: {
            statut,
            montantRetenuCentimes,
            motifRetenue: texte(donnees, "motifRetenue"),
          },
          demandeurId: session.user.id,
          demandeurEmail: session.user.email,
        });
        await withTenant(tenantId, (tx) =>
          tx.insert(auditLogs).values({
            tenantId,
            qui: session.user.email,
            action: "caution.validation_demandee",
            cible: cautionId,
            ref: cautionAvant.reservationId,
            payload: { montantRetenuCentimes },
          }),
        );
        redirect(303, `/hote/cautions?mois=${encodeURIComponent(mois)}&validation=en_attente`);
      }

      const caution = await new ChangerStatutCaution(
        new DrizzleCautionRepository(),
      ).executer({
        tenantId,
        cautionId,
        statut,
        montantRetenuCentimes,
        motifRetenue: texte(donnees, "motifRetenue"),
      });
      if (!caution) throw new ErreurMetier("CAUTION_INVALIDE", "Mise à jour impossible.");

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "caution.statut",
          cible: caution.id,
          ref: caution.reservationId,
          payload: {
            statut: caution.statut,
            montantRetenuCentimes: caution.montantRetenuCentimes,
          },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (!(error instanceof ErreurMetier)) {
        logErreur("cautions.statut", error, { tenantId, cautionId });
      }
      retour(mois, "erreur");
    }

    retour(mois, "ok");
  },

  deciderValidation: async (event) => {
    const session = requireRole(event, ["admin", "comptable"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const mois = texte(donnees, "mois");
    const validationId = texte(donnees, "validationId");
    const decision = texte(donnees, "decision");
    const motifDecision = texte(donnees, "motifDecision").slice(0, 500) || null;

    if (!validationId || (decision !== "approuvee" && decision !== "rejetee")) {
      redirect(303, `/hote/cautions?mois=${encodeURIComponent(mois)}&validation=erreur`);
    }

    try {
      const repo = new DrizzleValidationSensibleRepository();
      const validation = await repo.trouverParId(tenantId, validationId);
      if (
        !validation ||
        validation.statut !== "en_attente" ||
        validation.type !== "caution_retenue"
      ) {
        redirect(303, `/hote/cautions?mois=${encodeURIComponent(mois)}&validation=erreur`);
      }
      if (validation.demandeurId === session.user.id) {
        redirect(303, `/hote/cautions?mois=${encodeURIComponent(mois)}&validation=soi`);
      }

      if (decision === "approuvee" && validation.type === "caution_retenue") {
        const montantRetenuCentimes = Number(
          validation.payload.montantRetenuCentimes ?? 0,
        );
        const motifRetenue =
          typeof validation.payload.motifRetenue === "string"
            ? validation.payload.motifRetenue
            : "";
        const caution = await new ChangerStatutCaution(
          new DrizzleCautionRepository(),
        ).executer({
          tenantId,
          cautionId: validation.cibleId,
          statut: "retenue",
          montantRetenuCentimes,
          motifRetenue,
        });
        if (!caution) {
          throw new ErreurMetier("CAUTION_INVALIDE", "Caution introuvable.");
        }
      }

      const decidee = await repo.decider(
        tenantId,
        validation.id,
        decision,
        session.user.id,
        session.user.email,
        motifDecision,
      );
      if (!decidee) {
        redirect(303, `/hote/cautions?mois=${encodeURIComponent(mois)}&validation=erreur`);
      }

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action:
            decision === "approuvee"
              ? "caution.validation_approuvee"
              : "caution.validation_rejetee",
          cible: validation.cibleId,
          ref: validation.ref,
          payload: {
            validationId: validation.id,
            montantCentimes: validation.montantCentimes,
            demandeur: validation.demandeurEmail,
            motifDecision,
          },
        }),
      );
      redirect(
        303,
        `/hote/cautions?mois=${encodeURIComponent(mois)}&validation=${decision === "approuvee" ? "approuvee" : "rejetee"}`,
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (!(error instanceof ErreurMetier)) {
        logErreur("cautions.decider-validation", error, {
          tenantId,
          validationId,
        });
      }
      redirect(303, `/hote/cautions?mois=${encodeURIComponent(mois)}&validation=erreur`);
    }
  },
} satisfies Actions;
