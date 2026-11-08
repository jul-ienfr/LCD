import { isRedirect, redirect } from "@sveltejs/kit";
import { aujourdHuiIso } from "@/application/use-cases/inventaire";
import { EnregistrerEtatDesLieux } from "@/application/use-cases/etat-des-lieux";
import {
  analyserEtatDesLieux,
  estBrouillon,
  TYPES_ETAT_DES_LIEUX,
  type TypeEtatDesLieux,
} from "@/domain/etat-des-lieux";
import { ErreurMetier } from "@/domain/erreurs";
import { ETATS_BIEN, LIBELLES_ETAT, type EtatBien } from "@/domain/inventaire";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleBiensRepository } from "@/infrastructure/db/repositories/biens-repository";
import { DrizzleEtatsDesLieuxRepository } from "@/infrastructure/db/repositories/etats-des-lieux-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { formaterEuros } from "@/lib/format";
import { traductionsEtatsDesLieux } from "@/lib/i18n-etats-des-lieux";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const LIBELLES_TYPE: Record<TypeEtatDesLieux, string> = {
  entree: "Entrée",
  sortie: "Sortie",
};

function lien(logementId: string, params: Record<string, string> = {}): string {
  return `/hote/etats-des-lieux?${new URLSearchParams({
    logement: logementId,
    ...params,
  })}`;
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);

  if (logements.length === 0) {
    return {
      t: traductionsEtatsDesLieux(event.cookies.get("lcd_langue") ?? "fr"),
      vide: true,
      logements: [],
      logement: null,
      biens: [],
      reservations: [],
      etats: [],
      ref: `edl-${crypto.randomUUID()}`,
      aujourdHui: aujourdHuiIso(),
      types: TYPES_ETAT_DES_LIEUX.map((valeur) => ({
        valeur,
        libelle: LIBELLES_TYPE[valeur],
      })),
      etatsBien: ETATS_BIEN.map((valeur) => ({
        valeur,
        libelle: LIBELLES_ETAT[valeur],
      })),
      erreur: event.url.searchParams.get("erreur"),
    };
  }

  const logement =
    logements.find((entree) => entree.id === event.url.searchParams.get("logement")) ??
    logements[0];
  if (!logement) throw new Error("Aucun logement disponible.");

  const [biens, reservations, etats] = await Promise.all([
    new DrizzleBiensRepository().listerParLogement(tenantId, logement.id),
    new DrizzleReservationRepository().listerTous(tenantId),
    new DrizzleEtatsDesLieuxRepository().listerParTenant(tenantId),
  ]);

  const reservationsDuLogement = reservations
    .filter((reservation) => reservation.logementId === logement.id)
    .sort((a, b) => b.debut.localeCompare(a.debut))
    .slice(0, 40);
  const reservationParId = new Map(
    reservationsDuLogement.map((reservation) => [reservation.id, reservation]),
  );

  return {
    t: traductionsEtatsDesLieux(event.cookies.get("lcd_langue") ?? "fr"),
    vide: false,
    logements: logements.map((entree) => ({ id: entree.id, nom: entree.nom })),
    logement: { id: logement.id, nom: logement.nom, code: logement.code },
    biens: biens.map((bien) => ({
      id: bien.id,
      qr: bien.qr,
      label: bien.label,
      categorie: bien.categorie,
      etat: bien.etat,
      etatLabel: LIBELLES_ETAT[bien.etat],
      prixCentimes: bien.prixAchatCentimes,
    })),
    reservations: reservationsDuLogement.map((reservation) => ({
      id: reservation.id,
      ref: reservation.ref,
      clientNom: reservation.clientNom ?? null,
      debut: reservation.debut,
      fin: reservation.fin,
    })),
    etats: etats
      .filter((etat) => etat.logementId === logement.id)
      .map((etat) => {
        const analyse = analyserEtatDesLieux(etat.lignes);
        return {
          id: etat.id,
          ref: etat.ref,
          type: etat.type,
          typeLabel: LIBELLES_TYPE[etat.type],
          brouillon: estBrouillon(etat),
          date: etat.date,
          reservation: etat.reservationId
            ? reservationParId.get(etat.reservationId)?.ref ?? "Séjour lié"
            : "Sans séjour",
          manquants: analyse.manquants.length,
          degrades: analyse.degrades.length,
          coutRemplacement: formaterEuros(analyse.coutRemplacementCentimes),
        };
      }),
    ref: `edl-${crypto.randomUUID()}`,
    aujourdHui: aujourdHuiIso(),
    types: TYPES_ETAT_DES_LIEUX.map((valeur) => ({
      valeur,
      libelle: LIBELLES_TYPE[valeur],
    })),
    etatsBien: ETATS_BIEN.map((valeur) => ({
      valeur,
      libelle: LIBELLES_ETAT[valeur],
    })),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  creer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const ref = String(donnees.get("ref") ?? "");
    const type = String(donnees.get("type") ?? "");
    const date = String(donnees.get("date") ?? "");
    const notes = String(donnees.get("notes") ?? "");
    const reservationId = String(donnees.get("reservationId") ?? "") || null;

    const constats: Record<
      string,
      { etat: EtatBien | null; manquant: boolean; commentaire: string }
    > = {};
    for (const bien of await new DrizzleBiensRepository().listerParLogement(
      tenantId,
      logementId,
    )) {
      const etatTexte = String(donnees.get(`etat-${bien.qr}`) ?? "").trim();
      const etatNombre = etatTexte ? Number(etatTexte) : null;
      constats[bien.qr] = {
        etat:
          etatNombre !== null && Number.isInteger(etatNombre)
            ? (etatNombre as EtatBien)
            : null,
        manquant: donnees.get(`manquant-${bien.qr}`) === "on",
        commentaire: String(donnees.get(`commentaire-${bien.qr}`) ?? ""),
      };
    }

    try {
      const etat = await new EnregistrerEtatDesLieux(
        new DrizzleEtatsDesLieuxRepository(),
        new DrizzleBiensRepository(),
        new DrizzleReservationRepository(),
      ).executer({
        tenantId,
        logementId,
        reservationId,
        ref,
        type,
        date,
        notes,
        constats,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "etat_des_lieux.creer",
          cible: etat.id,
          ref: etat.ref,
          payload: {
            logementId,
            type: etat.type,
            manquants: analyserEtatDesLieux(etat.lignes).manquants.length,
          },
        }),
      );

      redirect(303, `/hote/etats-des-lieux/${etat.id}`);
    } catch (erreur) {
      if (isRedirect(erreur)) throw erreur;
      if (erreur instanceof ErreurMetier) {
        redirect(303, lien(logementId, { erreur: erreur.message }));
      }
      logErreur("etat_des_lieux.creer", erreur, { tenantId, logementId });
      redirect(303, lien(logementId, { erreur: "inattendu" }));
    }
  },
} satisfies Actions;
