import { error, redirect } from "@sveltejs/kit";
import { CompleterEtatDesLieux } from "@/application/use-cases/etat-des-lieux";
import {
  analyserEtatDesLieux,
  estBrouillon,
  type EtatDesLieux,
} from "@/domain/etat-des-lieux";
import { ErreurMetier } from "@/domain/erreurs";
import { ETATS_BIEN, LIBELLES_ETAT } from "@/domain/inventaire";
import { DrizzleEtatsDesLieuxRepository } from "@/infrastructure/db/repositories/etats-des-lieux-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { formaterEuros } from "@/lib/format";
import { traductionsDetails } from "@/lib/i18n-details";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const LIBELLES_TYPE = {
  entree: "Entrée",
  sortie: "Sortie",
} as const;

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const etat = await new DrizzleEtatsDesLieuxRepository().trouverParId(
    tenantId,
    event.params.id,
  );
  if (!etat) error(404, "État des lieux introuvable");

  const [logement, reservation] = await Promise.all([
    new DrizzleLogementRepository().trouverParId(tenantId, etat.logementId),
    etat.reservationId
      ? new DrizzleReservationRepository().trouverParId(
          tenantId,
          etat.reservationId,
        )
      : Promise.resolve(null),
  ]);
  const analyse = analyserEtatDesLieux(etat.lignes);

  return {
    t: traductionsDetails(event.cookies.get("lcd_langue") ?? "fr"),
    etat: {
      id: etat.id,
      ref: etat.ref,
      type: etat.type,
      typeLabel: LIBELLES_TYPE[etat.type],
      date: etat.date,
      notes: etat.notes || "—",
      notesValeur: etat.notes,
      createdAt: etat.createdAt.toLocaleString("fr-FR"),
    },
    brouillon: estBrouillon(etat),
    etats: ETATS_BIEN.map((valeur) => ({
      valeur,
      libelle: LIBELLES_ETAT[valeur],
    })),
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
    logement: logement
      ? { id: logement.id, nom: logement.nom, code: logement.code }
      : { id: etat.logementId, nom: "Logement introuvable", code: "—" },
    reservation: reservation
      ? {
          ref: reservation.ref,
          clientNom: reservation.clientNom ?? null,
          debut: reservation.debut,
          fin: reservation.fin,
        }
      : null,
    lignes: etat.lignes.map((ligne) => ({
      qr: ligne.qr,
      libelle: ligne.libelle,
      etatReference: LIBELLES_ETAT[ligne.etatReference],
      etatConstate:
        ligne.etatConstate === null ? null : LIBELLES_ETAT[ligne.etatConstate],
      etatConstateValeur: ligne.etatConstate,
      manquant: ligne.manquant,
      commentaire: ligne.commentaire || "—",
      commentaireValeur: ligne.commentaire,
      prixReference:
        ligne.prixReferenceCentimes === null
          ? "—"
          : formaterEuros(ligne.prixReferenceCentimes),
    })),
    analyse: {
      manquants: analyse.manquants.length,
      degrades: analyse.degrades.length,
      coutRemplacement: formaterEuros(analyse.coutRemplacementCentimes),
    },
  };
};

export const actions: Actions = {
  completer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const notes = String(donnees.get("notes") ?? "").trim();
    const nbLignes = Number.parseInt(
      String(donnees.get("nbLignes") ?? "0"),
      10,
    );
    const constats: Record<
      string,
      { etat: number | null; manquant: boolean; commentaire: string }
    > = {};

    for (let index = 0; index < nbLignes; index += 1) {
      const qr = String(donnees.get(`qr-${index}`) ?? "").trim();
      if (!qr) continue;
      const etatBrut = String(donnees.get(`etat-${index}`) ?? "").trim();
      constats[qr] = {
        etat: etatBrut === "" ? null : Number(etatBrut),
        manquant: donnees.get(`manquant-${index}`) !== null,
        commentaire: String(donnees.get(`commentaire-${index}`) ?? "").trim(),
      };
    }

    let resultat: EtatDesLieux | null = null;
    try {
      resultat = await new CompleterEtatDesLieux(
        new DrizzleEtatsDesLieuxRepository(),
      ).executer({
        tenantId,
        id: event.params.id,
        notes,
        constats,
      });
    } catch (erreur) {
      if (erreur instanceof ErreurMetier) {
        redirect(
          303,
          `/hote/etats-des-lieux/${event.params.id}?erreur=constat`,
        );
      }
      logErreur("etats-des-lieux.completer", erreur, {
        tenantId,
        etatDesLieuxId: event.params.id,
      });
      redirect(
        303,
        `/hote/etats-des-lieux/${event.params.id}?erreur=inattendu`,
      );
    }

    if (!resultat) error(404, "État des lieux introuvable");

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "etat_des_lieux.completer",
        cible: resultat.id,
        ref: resultat.ref,
        payload: {
          manquants: resultat.lignes.filter((ligne) => ligne.manquant).length,
          degrades: resultat.lignes.filter(
            (ligne) =>
              !ligne.manquant &&
              ligne.etatConstate !== null &&
              ligne.etatConstate < ligne.etatReference,
          ).length,
        },
      }),
    );

    redirect(303, `/hote/etats-des-lieux/${resultat.id}?ok=complet`);
  },
};
