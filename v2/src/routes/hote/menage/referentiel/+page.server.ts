import { fail, isRedirect, redirect } from "@sveltejs/kit";
import { ConfigurerReferentielMenage } from "@/application/use-cases/menage-referentiel";
import { ErreurMetier } from "@/domain/erreurs";
import {
  LIBELLE_PIECE_MAX,
  LIBELLE_TACHE_MAX,
  PIECES_MENAGE_MAX,
  TACHES_PAR_PIECE_MAX,
  type PieceReferentiel,
} from "@/domain/menage";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMenageReferentielRepository } from "@/infrastructure/db/repositories/menage-referentiel-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { exigerConfirmation } from "@/lib/server/confirmation";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";
import { langueRequete } from "@/lib/server/langue";

/** Rows offered for additions, au-delà des lignes du référentiel. */
const LIGNES_LIBRES = 6;

interface LigneReferentiel {
  piece: string;
  libelle: string;
}

/**
 * Lit les lignes saisies sans rien valider : sert aussi bien à enregistrer
 * qu'à réafficher la saisie telle quelle quand la validation refuse (FR-041).
 */
function lignesDepuisFormulaire(donnees: FormData): LigneReferentiel[] {
  const nbLignes = Number.parseInt(String(donnees.get("nbLignes") ?? "0"), 10);
  const lignes: LigneReferentiel[] = [];
  for (let index = 0; index < nbLignes; index += 1) {
    if (donnees.get(`supprimer-${index}`) !== null) continue;
    const piece = String(donnees.get(`piece-${index}`) ?? "");
    const libelle = String(donnees.get(`libelle-${index}`) ?? "");
    if (piece.trim() === "" && libelle.trim() === "") continue;
    lignes.push({ piece, libelle });
  }
  return lignes;
}

/** Regroupe les lignes par pièce, dans l'ordre d'apparition. */
function piecesDepuisLignes(lignes: readonly LigneReferentiel[]): {
  piece: string;
  taches: string[];
}[] {
  const ordre: string[] = [];
  const parPiece = new Map<string, string[]>();
  for (const ligne of lignes) {
    const cle = ligne.piece.trim();
    const taches = parPiece.get(cle);
    if (taches) {
      taches.push(ligne.libelle);
    } else {
      parPiece.set(cle, [ligne.libelle]);
      ordre.push(cle);
    }
  }
  return ordre.map((piece) => ({ piece, taches: parPiece.get(piece) ?? [] }));
}

function lien(logementId: string, params: Record<string, string> = {}): string {
  return `/hote/menage/referentiel?${new URLSearchParams({ logement: logementId, ...params })}`;
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const langue = langueRequete(event);
  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);
  const logement =
    logements.find((entree) => entree.id === event.url.searchParams.get("logement")) ??
    logements[0];

  if (!logement) {
    return {
      langue,
      vide: true,
      logements: [],
      logement: null,
      personnalise: false,
      lignes: [],
      lignesLibres: LIGNES_LIBRES,
      limites: {
        pieces: PIECES_MENAGE_MAX,
        tachesParPiece: TACHES_PAR_PIECE_MAX,
        piece: LIBELLE_PIECE_MAX,
        tache: LIBELLE_TACHE_MAX,
      },
      ok: event.url.searchParams.get("ok"),
      erreur: event.url.searchParams.get("erreur"),
    };
  }

  const referentiel = await new ConfigurerReferentielMenage(
    new DrizzleMenageReferentielRepository(),
  ).lister(tenantId, logement.id);

  return {
    langue,
    vide: false,
    logements: logements.map((entree) => ({ id: entree.id, nom: entree.nom })),
    logement: { id: logement.id, nom: logement.nom },
    personnalise: referentiel.personnalise,
    lignes: referentiel.pieces.flatMap((piece) =>
      piece.taches.map((libelle) => ({ piece: piece.piece, libelle })),
    ),
    lignesLibres: LIGNES_LIBRES,
    limites: {
      pieces: PIECES_MENAGE_MAX,
      tachesParPiece: TACHES_PAR_PIECE_MAX,
      piece: LIBELLE_PIECE_MAX,
      tache: LIBELLE_TACHE_MAX,
    },
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  enregistrer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const lignes = lignesDepuisFormulaire(donnees);

    let pieces: PieceReferentiel[];
    try {
      pieces = await new ConfigurerReferentielMenage(
        new DrizzleMenageReferentielRepository(),
      ).enregistrer(tenantId, logementId, piecesDepuisLignes(lignes));

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "menage.referentiel",
          cible: logementId,
          ref: logementId,
          payload: { pieces: pieces.length },
        }),
      );
    } catch (erreur) {
      if (isRedirect(erreur)) throw erreur;
      if (erreur instanceof ErreurMetier) {
        return fail(400, { ok: false, erreur: erreur.message, lignes });
      }
      logErreur("menage.referentiel", erreur, { tenantId, logementId });
      return fail(500, { ok: false, erreur: "inattendu", lignes });
    }

    redirect(303, lien(logementId, { ok: "enregistre" }));
  },

  reinitialiser: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");

    // Deux étapes (FR-039) : sans `confirmation`, le référentiel est conservé.
    exigerConfirmation(donnees, {
      action: "reinitialiser",
      retour: `/hote/menage/referentiel?logement=${encodeURIComponent(logementId)}`,
      cible: logementId,
    });

    try {
      const pieces = await new ConfigurerReferentielMenage(
        new DrizzleMenageReferentielRepository(),
      ).reinitialiser(tenantId, logementId);

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "menage.referentiel.reinitialiser",
          cible: logementId,
          ref: logementId,
          payload: { pieces: pieces.length },
        }),
      );
    } catch (erreur) {
      if (isRedirect(erreur)) throw erreur;
      if (erreur instanceof ErreurMetier) {
        redirect(303, lien(logementId, { erreur: erreur.message }));
      }
      logErreur("menage.referentiel.reinitialiser", erreur, {
        tenantId,
        logementId,
      });
      redirect(303, lien(logementId, { erreur: "inattendu" }));
    }

    redirect(303, lien(logementId, { ok: "reinitialise" }));
  },
} satisfies Actions;
