import type { Actions, PageServerLoad } from "./$types";
import {
  lireVersionPubliee,
  listerVersionsApparence,
} from "@/lib/server/apparence";
import { DrizzleSupervisionRepository } from "@/infrastructure/db/repositories/supervision-repository";
import { DrizzleEvenementsStripeRepository } from "@/infrastructure/db/repositories/evenements-stripe-repository";
import { requireSuperAdmin } from "@/lib/server/session";
import {
  lireSanteBox,
  lireSanteDisque,
  lireSanteTls,
} from "@/lib/server/sante-systeme";
import {
  acquitterAlerte,
  canalAlerteConfigure,
  listerAlertes,
} from "@/lib/server/alertes-exploitation";
import {
  ignorerEvenementStripe,
  rejouerEvenementStripe,
} from "@/lib/server/evenements-stripe";
import { santeDesTaches } from "@/lib/server/journal-execution";
import { logErreur } from "@/lib/logger";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async (event) => {
  const session = requireSuperAdmin(event);
  const evenementsStripeRepo = new DrizzleEvenementsStripeRepository();
  const [
    version,
    versions,
    situation,
    disque,
    tls,
    box,
    alertes,
    taches,
    evenementsStripe,
  ] = await Promise.all([
    lireVersionPubliee(),
    listerVersionsApparence(5),
    new DrizzleSupervisionRepository().situation(),
    lireSanteDisque(),
    lireSanteTls(),
    lireSanteBox(),
    listerAlertes({ statut: "ouverte", limite: 100 }).catch((erreur) => {
      logErreur("supervision.alertes", erreur);
      return [];
    }),
    santeDesTaches().catch((erreur) => {
      logErreur("supervision.taches", erreur);
      return [];
    }),
    evenementsStripeRepo.listerRecents(20).catch((erreur) => {
      logErreur("supervision.stripe", erreur);
      return [];
    }),
  ]);

  return {
    email: session.user.email,
    situation,
    sante: { disque, tls, box },
    alertes,
    canalAlerteConfigure: canalAlerteConfigure(),
    taches: taches.map((tache) => ({
      nom: tache.nom,
      libelle: tache.libelle,
      cadenceMinutes: tache.cadenceMinutes,
      critique: tache.critique,
      runbook: tache.runbook,
      etat: tache.sante.etat,
      ageMinutes: tache.sante.ageMinutes,
      seuilMinutes: tache.sante.seuilMinutes,
      derniereExecution: tache.derniereExecution?.toISOString() ?? null,
      dernierStatut: tache.dernierStatut,
    })),
    evenementsStripe: evenementsStripe.map((trace) => ({
      evenementId: trace.evenementId,
      type: trace.type,
      objetId: trace.objetId,
      statut: trace.statut,
      erreur: trace.erreur,
      tentatives: trace.tentatives,
      recuLe: trace.recuLe.toISOString(),
      traiteLe: trace.traiteLe?.toISOString() ?? null,
      rejoueLe: trace.rejoueLe?.toISOString() ?? null,
    })),
    version: version
      ? { version: version.version, publieLe: version.publieLe }
      : null,
    versions: versions.map((entree) => ({
      id: entree.id,
      version: entree.version,
      statut: entree.statut,
      publieLe: entree.publieLe,
    })),
  };
};

export const actions = {
  acquitter: async (event) => {
    requireSuperAdmin(event);
    const donnees = await event.request.formData();
    const cle = String(donnees.get("cle") ?? "");
    if (cle) {
      try {
        await acquitterAlerte(cle);
      } catch (erreur) {
        logErreur("supervision.acquitter", erreur, { cle });
      }
    }
    redirect(303, "/supervision?acquittee=1");
  },
  rejouer: async (event) => {
    requireSuperAdmin(event);
    const donnees = await event.request.formData();
    const evenementId = String(donnees.get("evenementId") ?? "");
    if (!evenementId) {
      redirect(303, "/supervision?rejeu=invalide");
    }
    try {
      await rejouerEvenementStripe(evenementId);
      redirect(303, "/supervision?rejeu=ok");
    } catch (erreur) {
      logErreur("supervision.rejouerStripe", erreur, { evenementId });
      redirect(303, "/supervision?rejeu=echec");
    }
  },
  ignorerEvenement: async (event) => {
    requireSuperAdmin(event);
    const donnees = await event.request.formData();
    const evenementId = String(donnees.get("evenementId") ?? "");
    if (!evenementId) {
      redirect(303, "/supervision?rejeu=invalide");
    }
    try {
      await ignorerEvenementStripe(evenementId);
      redirect(303, "/supervision?rejeu=ignore");
    } catch (erreur) {
      logErreur("supervision.ignorerStripe", erreur, { evenementId });
      redirect(303, "/supervision?rejeu=echec");
    }
  },
} satisfies Actions;
