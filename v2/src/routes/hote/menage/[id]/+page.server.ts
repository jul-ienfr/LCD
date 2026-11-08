import { error, isRedirect, redirect } from "@sveltejs/kit";
import {
  EnregistrerMenage,
  EvaluerMenage,
} from "@/application/use-cases/menage";
import { AjouterPhotoPreuve } from "@/application/use-cases/ajouter-photo-preuve";
import { ErreurMetier } from "@/domain/erreurs";
import {
  avancementMenage,
  LIBELLES_STATUT_MENAGE,
  STATUTS_MENAGE,
} from "@/domain/menage";
import {
  LIBELLES_PHASE_PHOTO,
  PHOTO_TAILLE_MAX_OCTETS,
  TYPES_PHOTO_ACCEPTES,
} from "@/domain/photo-preuve";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleConsommablesRepository } from "@/infrastructure/db/repositories/consommables-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMenagesRepository } from "@/infrastructure/db/repositories/menages-repository";
import { DrizzlePhotoPreuveRepository } from "@/infrastructure/db/repositories/photo-preuve-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie } from "@/lib/format";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import { stockageFichiers } from "@/lib/server/stockage";
import type { Actions, PageServerLoad } from "./$types";

function tachesDepuisFormulaire(
  donnees: FormData,
): { libelle: string; fait: boolean }[] {
  const taches: { libelle: string; fait: boolean }[] = [];
  for (let index = 0; ; index += 1) {
    const libelle = donnees.get(`libelle-${index}`);
    if (libelle === null) break;
    taches.push({
      libelle: String(libelle),
      fait: donnees.get(`tache-${index}`) === "on",
    });
  }
  return taches;
}

function lien(id: string, params: Record<string, string> = {}): string {
  return `/hote/menage/${encodeURIComponent(id)}?${new URLSearchParams(params)}`;
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const menage = await new DrizzleMenagesRepository().trouverParId(
    tenantId,
    event.params.id,
  );
  if (!menage) error(404, "Ménage introuvable");

  const logement = await new DrizzleLogementRepository().trouverParId(
    tenantId,
    menage.logementId,
  );
  const avancement = avancementMenage(menage.taches);
  const photos = await new DrizzlePhotoPreuveRepository().listerParMenage(
    tenantId,
    menage.id,
  );

  return {
    langue: event.cookies.get("lcd_langue") ?? "fr",
    menage: {
      id: menage.id,
      ref: menage.ref,
      date: menage.date,
      statut: menage.statut,
      statutLabel: LIBELLES_STATUT_MENAGE[menage.statut],
      notes: menage.notes,
      score: menage.score,
      coutEuros:
        menage.coutCentimes === null
          ? ""
          : (menage.coutCentimes / 100).toFixed(2),
      dureeMinutes: menage.dureeMinutes,
      taches: menage.taches,
    },
    logement: logement
      ? { id: logement.id, nom: logement.nom, code: logement.code }
      : { id: menage.logementId, nom: "Logement introuvable", code: "—" },
    avancement,
    photos: photos.map((photo) => ({
      id: photo.id,
      url: `/api/photos/${photo.id}`,
      phase: photo.phase,
      phaseLabel: LIBELLES_PHASE_PHOTO[photo.phase],
      tailleMo: (photo.tailleOctets / 1024 / 1024).toFixed(1),
      creeLe: photo.createdAt.toISOString(),
    })),
    photoMaxMo: PHOTO_TAILLE_MAX_OCTETS / 1024 / 1024,
    photoTypes: TYPES_PHOTO_ACCEPTES.join(","),
    statuts: STATUTS_MENAGE.map((valeur) => ({
      valeur,
      libelle: LIBELLES_STATUT_MENAGE[valeur],
    })),
    ok: event.url.searchParams.get("ok"),
    evincees: event.url.searchParams.get("evincees"),
    evalue: event.url.searchParams.get("evalue"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  enregistrer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = String(donnees.get("id") ?? "");

    try {
      const menage = await new EnregistrerMenage(
        new DrizzleMenagesRepository(),
        new DrizzleConsommablesRepository(),
      ).executer({
        tenantId,
        id,
        statut: String(donnees.get("statut") ?? ""),
        notes: String(donnees.get("notes") ?? ""),
        taches: tachesDepuisFormulaire(donnees),
        qui: session.user.email,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "menage.enregistrer",
          cible: menage.id,
          ref: menage.ref,
          payload: { statut: menage.statut, taches: menage.taches.length },
        }),
      );
    } catch (erreur) {
      if (isRedirect(erreur)) throw erreur;
      if (erreur instanceof ErreurMetier) {
        redirect(303, lien(id, { erreur: erreur.message }));
      }
      logErreur("menage.enregistrer", erreur, { tenantId, id });
      redirect(303, lien(id, { erreur: "inattendu" }));
    }

    redirect(303, lien(id, { ok: "1" }));
  },

  evaluer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = String(donnees.get("id") ?? "");
    const scoreTexte = String(donnees.get("score") ?? "").trim();
    const coutTexte = String(donnees.get("coutEuros") ?? "").trim();
    const dureeTexte = String(donnees.get("dureeMinutes") ?? "").trim();
    const coutCentimes = coutTexte ? centimesDepuisSaisie(coutTexte) : null;

    if (coutTexte && coutCentimes === null) {
      redirect(303, lien(id, { erreur: "Le coût est invalide." }));
    }

    try {
      const menage = await new EvaluerMenage(
        new DrizzleMenagesRepository(),
      ).executer({
        tenantId,
        id,
        score: scoreTexte ? Number(scoreTexte) : null,
        coutCentimes,
        dureeMinutes: dureeTexte ? Number(dureeTexte) : null,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "menage.evaluer",
          cible: menage.id,
          ref: menage.ref,
          payload: {
            score: menage.score,
            coutCentimes: menage.coutCentimes,
            dureeMinutes: menage.dureeMinutes,
          },
        }),
      );
    } catch (erreur) {
      if (isRedirect(erreur)) throw erreur;
      if (erreur instanceof ErreurMetier) {
        redirect(303, lien(id, { erreur: erreur.message }));
      }
      logErreur("menage.evaluer", erreur, { tenantId, id });
      redirect(303, lien(id, { erreur: "inattendu" }));
    }

    redirect(303, lien(id, { evalue: "1" }));
  },

  photo: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = String(donnees.get("id") ?? "");
    const fichier = donnees.get("photo");

    if (!(fichier instanceof File) || fichier.size === 0) {
      redirect(303, lien(id, { erreur: "Choisissez une photo." }));
    }

    try {
      const resultat = await new AjouterPhotoPreuve(
        new DrizzleMenagesRepository(),
        new DrizzlePhotoPreuveRepository(),
        stockageFichiers(),
      ).executer({
        tenantId,
        menageId: id,
        phase: String(donnees.get("phase") ?? ""),
        contentType: fichier.type,
        octets: new Uint8Array(await fichier.arrayBuffer()),
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "menage.photo",
          cible: id,
          ref: resultat.photo.ref,
          payload: {
            photoId: resultat.photo.id,
            phase: resultat.photo.phase,
            tailleOctets: resultat.photo.tailleOctets,
            evincees: resultat.evincees,
          },
        }),
      );
      redirect(
        303,
        lien(id, {
          ok: "photo",
          ...(resultat.evincees > 0
            ? { evincees: String(resultat.evincees) }
            : {}),
        }),
      );
    } catch (erreur) {
      if (isRedirect(erreur)) throw erreur;
      if (erreur instanceof ErreurMetier) {
        redirect(303, lien(id, { erreur: erreur.message }));
      }
      logErreur("menage.photo", erreur, { tenantId, id });
      redirect(303, lien(id, { erreur: "inattendu" }));
    }
  },

  supprimerPhoto: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = String(donnees.get("id") ?? "");
    const photoId = String(donnees.get("photoId") ?? "");
    const photos = new DrizzlePhotoPreuveRepository();

    try {
      const photo = await photos.trouverParId(tenantId, photoId);
      if (!photo || photo.menageId !== id) {
        redirect(303, lien(id, { erreur: "Photo introuvable." }));
      }
      await stockageFichiers().delete(photo.chemin).catch((erreur) => {
        logErreur("menage.photo.supprimer.fichier", erreur, { photoId });
      });
      await photos.supprimer(tenantId, photoId);
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "menage.photo.supprimer",
          cible: id,
          ref: photo.ref,
          payload: { photoId, phase: photo.phase },
        }),
      );
    } catch (erreur) {
      if (isRedirect(erreur)) throw erreur;
      logErreur("menage.photo.supprimer", erreur, { tenantId, id, photoId });
      redirect(303, lien(id, { erreur: "inattendu" }));
    }

    redirect(303, lien(id, { ok: "photo-supprimee" }));
  },
} satisfies Actions;
