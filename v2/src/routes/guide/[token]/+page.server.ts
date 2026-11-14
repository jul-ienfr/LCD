/**
 * T604 — Page publique guide voyageur `/guide/[token]`.
 *
 * Accès sans compte, sans JS obligatoire (HTML-first, règle 1).
 * Le token HMAC est vérifié AVANT toute lecture du payload (règle 11) :
 * `verifierLienGuide` retourne `null` sur toute anomalie sans jamais lever.
 *
 * T608 — La page porte aussi la demande d'extra (départ tardif, arrivée
 * anticipée, lit bébé...). Le voyageur *propose* ; le prix indicatif vient du
 * domaine (`prixDepartTardif`, `prixArriveeAnticipee`) et un humain du staff
 * valide dans `/hote/demandes-extra`.
 *
 * `export const csr = false` : route publique voyageur, aucun îlot JS (règle 3).
 */
import { isRedirect, redirect } from "@sveltejs/kit";
import { DemanderExtra } from "@/application/use-cases/demander-extra";
import {
  LIBELLES_EXTRA,
  TYPES_EXTRA,
  type StatutDemandeExtra,
  type TypeExtra,
} from "@/domain/demande-extra";
import { ErreurMetier } from "@/domain/erreurs";
import {
  ORDRE_SECTIONS_GUIDE,
  resoudreContenuSection,
  verifierLienGuide,
  type GuideVoyageur,
  type LangueGuide,
} from "@/domain/guide-voyageur";
import { nuitsEntre } from "@/domain/calendrier";
import { PLANCHER_ABSOLU_CENTIMES } from "@/domain/recommandation-prix";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleDemandesExtraRepository } from "@/infrastructure/db/repositories/demandes-extra-repository";
import {
  DrizzleAccesSerrureRepository,
  DrizzleGuideContenusRepository,
} from "@/infrastructure/db/repositories/guides-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import type { Actions, PageServerLoad } from "./$types";

export const csr = false;

const LIBELLES_SECTIONS: Record<string, string> = {
  arrivee: "Arrivée",
  wifi: "WiFi",
  sejour: "Séjour",
  depart: "Départ",
  urgence: "Urgence",
};

const LIBELLES_STATUT_EXTRA: Record<StatutDemandeExtra, string> = {
  demande: "En attente de validation",
  validee: "Validée",
  refusee: "Refusée",
  facturee: "Facturée",
};

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

/**
 * Prix indicatif d'une nuit, base des suppléments temporaires. Si le montant de
 * la réservation est inexploitable (import sans prix), on retombe sur le
 * plancher tarifaire : la demande reste une proposition, jamais une erreur.
 */
function prixNuitIndicatif(reservation: {
  montantCentimes: number;
  debut: string;
  fin: string;
}): number {
  const nuits = nuitsEntre(reservation.debut, reservation.fin);
  if (nuits > 0 && reservation.montantCentimes > 0) {
    return Math.round(reservation.montantCentimes / nuits);
  }
  return PLANCHER_ABSOLU_CENTIMES;
}

function formaterEuros(centimes: number): string {
  return `${(centimes / 100).toFixed(2)} €`;
}

export const load: PageServerLoad = async ({ params, url }) => {
  // Règle 11 : vérifier la signature HMAC AVANT toute lecture du payload.
  const payload = verifierLienGuide(env.BETTER_AUTH_SECRET, params.token);
  if (!payload) return { indisponible: "invalide" as const };

  // Vérifier que la réservation existe et correspond au logement.
  const reservation = await new DrizzleReservationRepository().trouverParId(
    payload.tenantId,
    payload.reservationId,
  );
  if (!reservation || reservation.logementId !== payload.logementId) {
    return { indisponible: "reservation" as const };
  }

  // Charger le logement, les contenus du guide et le code d'accès actif.
  const [logement, contenus, acces] = await Promise.all([
    new DrizzleLogementRepository().trouverParId(
      payload.tenantId,
      payload.logementId,
    ),
    new DrizzleGuideContenusRepository().listerParLogement(
      payload.tenantId,
      payload.logementId,
    ),
    new DrizzleAccesSerrureRepository().listerParReservation(
      payload.tenantId,
      reservation.id,
    ),
  ]);
  if (!logement) return { indisponible: "logement" as const };
  const accesActif = acces.find((ligne) => ligne.code) ?? null;

  // Construire le guide virtuel pour la résolution par langue.
  const langueDefaut: LangueGuide =
    (logement.guideLangueDefaut as LangueGuide) ?? "fr";
  const sections = new Map<
    string,
    Record<string, { langue: LangueGuide; titre: string; corps: string }>
  >();
  for (const c of contenus) {
    if (!sections.has(c.section)) sections.set(c.section, {});
    sections.get(c.section)![c.langue] = {
      langue: c.langue,
      titre: c.titre,
      corps: c.corps,
    };
  }
  const guide: GuideVoyageur = {
    logementId: logement.id,
    langueParDefaut: langueDefaut,
    telUrgence: logement.urgenceTel ?? null,
    sections: Object.fromEntries(sections),
  };

  // Résoudre chaque section pour la langue par défaut du guide.
  const sectionsAffichees = ORDRE_SECTIONS_GUIDE.map((section) => {
    const contenu = resoudreContenuSection(guide, section, langueDefaut);
    return {
      section,
      libelle: LIBELLES_SECTIONS[section] ?? section,
      titre: contenu?.titre ?? LIBELLES_SECTIONS[section] ?? section,
      corps: contenu?.corps ?? null,
    };
  }).filter((s) => s.corps !== null);

  return {
    indisponible: null,
    token: params.token,
    logementNom: logement.nom,
    checkinHeure: logement.checkinHeure ?? null,
    checkinInstructions: logement.checkinInstructions ?? null,
    wifiSsid: logement.wifiSsid ?? null,
    wifiPassword: logement.wifiPassword ?? null,
    urgenceTel: logement.urgenceTel ?? null,
    guidePartenaireNom: logement.guidePartenaireNom ?? null,
    guidePartenaireUrl: logement.guidePartenaireUrl ?? null,
    sections: sectionsAffichees,
    codeAcces: accesActif
      ? {
          code: accesActif.code ?? "",
          valideDe: accesActif.valideDe,
          valideA: accesActif.valideA,
          fournisseur: accesActif.fournisseur,
        }
      : null,
    debut: reservation.debut,
    fin: reservation.fin,
    // T608 — demandes d'extras déjà déposées, du plus récent au plus ancien.
    demandes: (
      await new DrizzleDemandesExtraRepository().listerParReservation(
        payload.tenantId,
        reservation.id,
      )
    ).map((demande) => ({
      id: demande.id,
      libelle: LIBELLES_EXTRA[demande.type as TypeExtra] ?? demande.type,
      message: demande.message,
      prixFormatte: formaterEuros(demande.prixCentimes),
      statut: demande.statut,
      libelleStatut: LIBELLES_STATUT_EXTRA[demande.statut] ?? demande.statut,
      motifRefus: demande.motifRefus,
    })),
    types: TYPES_EXTRA.map((type) => ({
      valeur: type,
      libelle: LIBELLES_EXTRA[type],
    })),
    extraOk: url.searchParams.get("extra") === "ok",
    extraErreur: url.searchParams.get("erreur"),
  };
};

export const actions: Actions = {
  /** T608 — Le voyageur propose un extra ; le staff décide ensuite. */
  extra: async ({ params, request }) => {
    // Règle 11 : signature vérifiée avant toute lecture du payload.
    const payload = verifierLienGuide(env.BETTER_AUTH_SECRET, params.token);
    if (!payload) redirect(303, "/guide/invalide");

    const donnees = await request.formData();
    const type = texte(donnees, "type");
    const message = texte(donnees, "message") || null;
    const retour = `/guide/${encodeURIComponent(params.token)}`;

    // La réservation est revalidée côté serveur : le payload signé ne donne
    // jamais le droit d'écrire sur un autre logement.
    const reservation = await new DrizzleReservationRepository().trouverParId(
      payload.tenantId,
      payload.reservationId,
    );
    if (!reservation || reservation.logementId !== payload.logementId) {
      redirect(303, `${retour}?erreur=reservation`);
    }

    try {
      const demande = await new DemanderExtra({
        demandes: new DrizzleDemandesExtraRepository(),
      }).executer({
        tenantId: payload.tenantId,
        logementId: payload.logementId,
        reservationId: reservation.id,
        type,
        message,
        prixNuitCentimes: prixNuitIndicatif(reservation),
      });

      await withTenant(payload.tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId: payload.tenantId,
          qui: "voyageur",
          action: "extra.demande",
          cible: demande.ref,
          ref: demande.ref,
          payload: {
            demandeId: demande.id,
            reservationId: reservation.id,
            type: demande.type,
            prixCentimes: demande.prixCentimes,
            cree: demande.cree,
          },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          `${retour}?erreur=${encodeURIComponent(error.message)}`,
        );
      }
      logErreur("extra.demander", error, {
        tenantId: payload.tenantId,
        reservationId: payload.reservationId,
      });
      redirect(303, `${retour}?erreur=extra`);
    }

    redirect(303, `${retour}?extra=ok`);
  },
};
