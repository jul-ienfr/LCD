import { fail, redirect } from "@sveltejs/kit";
import { ActiverFournisseur } from "@/application/use-cases/activer-fournisseur";
import { AffecterFournisseur } from "@/application/use-cases/affecter-fournisseur";
import { BasculerFournisseur } from "@/application/use-cases/basculer-fournisseur";
import { RetirerFournisseur } from "@/application/use-cases/retirer-fournisseur";
import {
  CATALOGUE_FOURNISSEURS,
  RECOMMANDATIONS_FOURNISSEURS,
  codeFournisseurValide,
  ficheFournisseur,
  type CodeFournisseur,
} from "@/domain/fournisseur";
import { construireAlertesFournisseurs } from "@/domain/alertes-fournisseur";
import { ErreurMetier } from "@/domain/erreurs";
import {
  creerFournisseur,
  fournisseurConfigure,
  webhookFournisseurConfigure,
} from "@/infrastructure/adapters/fournisseurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleDemandeSyncRepository } from "@/infrastructure/db/repositories/demande-sync-repository";
import { DrizzleFournisseurRepository } from "@/infrastructure/db/repositories/fournisseur-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { acquerirVerrouSysteme } from "@/infrastructure/db/verrou-systeme";
import { jourParis } from "@/lib/date-paris";
import { env } from "@/lib/env";
import { traiterDemandesSync } from "@/lib/server/fournisseur-outbox";
import { creerSynchroniseurFournisseur } from "@/lib/server/fournisseur-runtime";
import { santeLogementFournisseur } from "@/lib/server/fournisseur-sante";
import { logErreur } from "@/lib/logger";
import { requireSuperAdmin, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, cle: string): string {
  return String(donnees.get(cle) ?? "").trim();
}

async function auditer(
  session: ReturnType<typeof requireSuperAdmin>,
  action: string,
  cible: string,
  payload: Record<string, unknown>,
  tenantId = tenantIdDeSession(session),
): Promise<void> {
  await withTenant(tenantId, (tx) =>
    tx.insert(auditLogs).values({
      tenantId,
      qui: session.user.email ?? "super-admin",
      action,
      cible,
      ref: String(payload.code ?? payload.fournisseurCode ?? ""),
      payload,
    }),
  );
}

export const load: PageServerLoad = async (event) => {
  const session = requireSuperAdmin(event);
  const repo = new DrizzleFournisseurRepository();
  const demandesRepo = new DrizzleDemandeSyncRepository();
  const [activations, logements, demandesBrutes] = await Promise.all([
    repo.listerActivations(),
    repo.listerLogementsAvecFournisseur(),
    demandesRepo.listerPourSupervision(20),
  ]);
  const activationParCode = new Map(
    (activations ?? []).map((activation) => [activation.code, activation]),
  );
  const fiches = CATALOGUE_FOURNISSEURS.map((fiche) => ({
    ...fiche,
    actif: activationParCode.get(fiche.code)?.actif ?? false,
    configure: fournisseurConfigure(fiche.code),
    webhookConfigure: webhookFournisseurConfigure(fiche.code),
    affectations:
      logements?.filter((logement) => logement.fournisseurCode === fiche.code)
        .length ?? 0,
  }));
  const maintenant = new Date();
  const logementsAvecSante = (logements ?? []).map((logement) => ({
    ...logement,
    sante: santeLogementFournisseur(logement, maintenant),
  }));
  const alertes = construireAlertesFournisseurs(logementsAvecSante);
  const demandes = (demandesBrutes ?? []).map((demande) => {
    const logement = logements?.find(
      (entree) => entree.logementId === demande.logementId,
    );
    return {
      ...demande,
      tenantNom: logement?.tenantNom ?? demande.tenantId,
      logementNom: logement?.logementNom ?? demande.logementId,
    };
  });
  const recommandations = RECOMMANDATIONS_FOURNISSEURS.map((entree) => ({
    ...entree,
    principalNom: ficheFournisseur(entree.principal)?.nom ?? entree.principal,
    alternativeNom: entree.alternative
      ? (ficheFournisseur(entree.alternative)?.nom ?? entree.alternative)
      : null,
  }));
  const ok = event.url.searchParams.get("ok");
  const message =
    ok === "actif"
      ? "Fournisseur activé."
      : ok === "inactif"
        ? "Fournisseur désactivé."
        : ok === "affecte"
          ? "Fournisseur affecté au logement."
          : ok === "retire"
            ? "Fournisseur retiré du logement."
            : ok === "suspendu"
              ? "Fournisseur suspendu pour ce logement ; le flux iCal reste actif."
              : ok === "repris"
                ? "Fournisseur réactivé pour ce logement."
                : ok === "demandes"
              ? `Demandes relancées : ${
                  event.url.searchParams.get("relancees") ?? "0"
                }. Traitement en cours.`
              : null;

  return {
    email: session.user.email ?? null,
    fiches,
    logements: logementsAvecSante,
    alertes,
    demandes,
    demandesOwnerDisponible: demandesBrutes !== null,
    ownerDisponible: logements !== null,
    recommandations,
    message,
  };
};

export const actions = {
  activer: async (event) => {
    const session = requireSuperAdmin(event);
    const donnees = await event.request.formData();
    const code = texte(donnees, "code");
    const actif = texte(donnees, "actif") === "true";
    if (!codeFournisseurValide(code)) {
      return fail(400, { ok: false, message: "Fournisseur inconnu." });
    }
    try {
      await new ActiverFournisseur(
        new DrizzleFournisseurRepository(),
      ).executer({ code, actif, acteur: session.user.email ?? "super-admin" });
      await auditer(
        session,
        actif ? "fournisseur.activer" : "fournisseur.desactiver",
        code,
        { code, actif },
      );
    } catch (error) {
      if (error instanceof ErreurMetier) {
        return fail(400, { ok: false, message: error.message });
      }
      logErreur("supervision.fournisseurs.activer", error);
      return fail(500, {
        ok: false,
        message: "Erreur inattendue pendant l’activation.",
      });
    }
    redirect(303, `/supervision/fournisseurs?ok=${actif ? "actif" : "inactif"}`);
  },

  affecter: async (event) => {
    const session = requireSuperAdmin(event);
    const donnees = await event.request.formData();
    const tenantId = texte(donnees, "tenantId");
    const logementId = texte(donnees, "logementId");
    const fournisseurCode = texte(donnees, "fournisseurCode");
    if (!codeFournisseurValide(fournisseurCode)) {
      return fail(400, { ok: false, message: "Fournisseur inconnu." });
    }
    if (!tenantId || !logementId) {
      return fail(400, { ok: false, message: "Logement manquant." });
    }
    try {
      await new AffecterFournisseur(
        new DrizzleFournisseurRepository(),
      ).executer({
        tenantId,
        logementId,
        fournisseurCode,
        externalPropertyId: texte(donnees, "externalPropertyId") || null,
        externalRoomTypeId: texte(donnees, "externalRoomTypeId") || null,
        externalRatePlanId: texte(donnees, "externalRatePlanId") || null,
      });
      await auditer(
        session,
        "fournisseur.affecter",
        logementId,
        {
          tenantId,
          logementId,
          fournisseurCode,
          externalPropertyId: texte(donnees, "externalPropertyId"),
        },
        tenantId,
      );
    } catch (error) {
      if (error instanceof ErreurMetier) {
        return fail(400, { ok: false, message: error.message });
      }
      logErreur("supervision.fournisseurs.affecter", error, {
        tenantId,
        logementId,
      });
      return fail(500, {
        ok: false,
        message: "Erreur inattendue pendant l’affectation.",
      });
    }
    redirect(303, "/supervision/fournisseurs?ok=affecte");
  },

  basculer: async (event) => {
    const session = requireSuperAdmin(event);
    const donnees = await event.request.formData();
    const tenantId = texte(donnees, "tenantId");
    const logementId = texte(donnees, "logementId");
    const actif = texte(donnees, "actif") === "true";
    if (!tenantId || !logementId) {
      return fail(400, { ok: false, message: "Logement manquant." });
    }
    try {
      await new BasculerFournisseur(
        new DrizzleFournisseurRepository(),
      ).executer({ tenantId, logementId, actif });
      await auditer(
        session,
        actif ? "fournisseur.reprendre" : "fournisseur.suspendre",
        logementId,
        { tenantId, logementId, actif },
        tenantId,
      );
    } catch (error) {
      if (error instanceof ErreurMetier) {
        return fail(400, { ok: false, message: error.message });
      }
      logErreur("supervision.fournisseurs.basculer", error, {
        tenantId,
        logementId,
      });
      return fail(500, {
        ok: false,
        message: "Erreur inattendue pendant la bascule.",
      });
    }
    redirect(
      303,
      `/supervision/fournisseurs?ok=${actif ? "repris" : "suspendu"}`,
    );
  },

  retirer: async (event) => {
    const session = requireSuperAdmin(event);
    const donnees = await event.request.formData();
    const tenantId = texte(donnees, "tenantId");
    const logementId = texte(donnees, "logementId");
    if (!tenantId || !logementId) {
      return fail(400, { ok: false, message: "Logement manquant." });
    }
    try {
      await new RetirerFournisseur(
        new DrizzleFournisseurRepository(),
      ).executer({ tenantId, logementId });
      await auditer(
        session,
        "fournisseur.retirer",
        logementId,
        { tenantId, logementId },
        tenantId,
      );
    } catch (error) {
      if (error instanceof ErreurMetier) {
        return fail(400, { ok: false, message: error.message });
      }
      logErreur("supervision.fournisseurs.retirer", error, {
        tenantId,
        logementId,
      });
      return fail(500, {
        ok: false,
        message: "Erreur inattendue pendant le retrait.",
      });
    }
    redirect(303, "/supervision/fournisseurs?ok=retire");
  },

  synchroniser: async (event) => {
    const session = requireSuperAdmin(event);
    const donnees = await event.request.formData();
    const tenantId = texte(donnees, "tenantId");
    const logementId = texte(donnees, "logementId");
    if (!tenantId || !logementId) {
      return fail(400, { ok: false, message: "Logement manquant." });
    }
    try {
      const verrou = await acquerirVerrouSysteme(
        "fournisseur-sync",
        env.FOURNISSEUR_SYNC_LEASE_MINUTES,
      );
      if (!verrou) {
        return fail(409, {
          ok: false,
          message: "Une synchronisation est déjà en cours.",
        });
      }
      try {
        const resultat = await creerSynchroniseurFournisseur().executer({
          tenantId,
          logementId,
          maintenant: jourParis(),
          horizonJours: env.FOURNISSEUR_SYNC_HORIZON_JOURS,
          joursPasse: env.FOURNISSEUR_SYNC_PAST_DAYS,
          force: true,
        });
        await auditer(
          session,
          "fournisseur.synchroniser",
          logementId,
          {
            tenantId,
            logementId,
            statut: resultat.statut,
            crees: resultat.import.crees,
            conflits: resultat.import.conflits,
          },
          tenantId,
        );
        return {
          ok: resultat.statut !== "configuration_incomplete",
          message: `Synchronisation ${resultat.statut}${
            resultat.message ? ` : ${resultat.message}` : ""
          }`,
          fournisseur: resultat.statut,
        };
      } finally {
        await verrou.liberer().catch((erreur) => {
          logErreur("supervision.fournisseurs.verrou", erreur, {
            tenantId,
            logementId,
          });
        });
      }
    } catch (error) {
      if (error instanceof ErreurMetier) {
        return fail(400, { ok: false, message: error.message });
      }
      logErreur("supervision.fournisseurs.synchroniser", error, {
        tenantId,
        logementId,
      });
      return fail(500, {
        ok: false,
        message: "Erreur inattendue pendant la synchronisation.",
      });
    }
  },

  rejouerDemandes: async (event) => {
    const session = requireSuperAdmin(event);
    let relancees = 0;
    try {
      relancees = await new DrizzleDemandeSyncRepository().relancerToutes();
      await auditer(session, "fournisseur.demandes.rejouer", "demandes_sync", {
        relancees,
      });
      void traiterDemandesSync({ limite: 20 }).catch((error) => {
        logErreur("supervision.fournisseurs.demandes", error);
      });
    } catch (error) {
      logErreur("supervision.fournisseurs.demandes", error);
      return fail(500, {
        ok: false,
        message: "Erreur inattendue pendant le rejeu des demandes.",
      });
    }
    redirect(303, `/supervision/fournisseurs?ok=demandes&relancees=${relancees}`);
  },

  tester: async (event) => {
    const session = requireSuperAdmin(event);
    const donnees = await event.request.formData();
    const code = texte(donnees, "code");
    if (!codeFournisseurValide(code)) {
      return fail(400, { ok: false, message: "Fournisseur inconnu." });
    }
    if (!fournisseurConfigure(code as CodeFournisseur)) {
      return fail(400, {
        ok: false,
        message:
          "Clé serveur absente : renseignez la variable d’environnement du fournisseur.",
      });
    }
    try {
      const resultat = await creerFournisseur(code).testerConnexion();
      await auditer(session, "fournisseur.tester", code, {
        code,
        ok: resultat.ok,
      });
      return {
        ok: resultat.ok,
        message: resultat.message,
        fournisseur: code,
      };
    } catch (error) {
      if (error instanceof ErreurMetier) {
        return fail(400, { ok: false, message: error.message, fournisseur: code });
      }
      logErreur("supervision.fournisseurs.tester", error, { code });
      return fail(500, {
        ok: false,
        message: "Erreur inattendue pendant le test.",
        fournisseur: code,
      });
    }
  },
} satisfies Actions;
