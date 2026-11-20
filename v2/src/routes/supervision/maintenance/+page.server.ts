/**
 * FR-017 (spec 006) — bascule du mode maintenance global.
 *
 * Activation en deux étapes (case de confirmation obligatoire), désactivation
 * en un geste. Chaque bascule est tracée dans l'audit et vide le cache de
 * lecture pour que l'effet soit immédiat, sans redéploiement.
 */
import { fail, redirect } from "@sveltejs/kit";
import {
  lireEtatMaintenance,
  normaliserMessageMaintenance,
  serialiserEtatMaintenance,
} from "@/domain/maintenance";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";
import { logErreur } from "@/lib/logger";
import {
  CLE_PARAMETRE_MAINTENANCE,
  viderCacheMaintenance,
} from "@/lib/server/maintenance";
import { requireSuperAdmin, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const depots = new DrizzleParametresSiteRepository();

export const load: PageServerLoad = async (event) => {
  const session = requireSuperAdmin(event);
  let brut: string | null = null;
  try {
    brut = await depots.lire(CLE_PARAMETRE_MAINTENANCE);
  } catch (erreur) {
    logErreur("supervision.maintenance.lecture", erreur);
  }
  return {
    email: session.user.email,
    etat: lireEtatMaintenance(brut),
    confirmer: event.url.searchParams.get("maintenance") === "confirmer",
  };
};

export const actions = {
  activer: async (event) => {
    const session = requireSuperAdmin(event);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    if (donnees.get("confirmation") !== "oui") {
      redirect(303, "/supervision/maintenance?maintenance=confirmer");
    }
    const message = normaliserMessageMaintenance(donnees.get("message"));
    const etat = {
      actif: true,
      message,
      debutLe: new Date().toISOString(),
      par: session.user.email ?? "super-admin",
    };
    try {
      await depots.ecrire(
        CLE_PARAMETRE_MAINTENANCE,
        serialiserEtatMaintenance(etat),
      );
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email ?? "super-admin",
          action: "maintenance.activer",
          cible: "plateforme",
          ref: "maintenance",
          payload: { message },
        }),
      );
      viderCacheMaintenance();
      return { ok: true, actif: true };
    } catch (erreur) {
      logErreur("supervision.maintenance.activer", erreur);
      return fail(500, { erreur: "Activation impossible." });
    }
  },

  desactiver: async (event) => {
    const session = requireSuperAdmin(event);
    const tenantId = tenantIdDeSession(session);
    try {
      await depots.ecrire(
        CLE_PARAMETRE_MAINTENANCE,
        serialiserEtatMaintenance({
          actif: false,
          message: null,
          debutLe: null,
          par: null,
        }),
      );
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email ?? "super-admin",
          action: "maintenance.desactiver",
          cible: "plateforme",
          ref: "maintenance",
          payload: {},
        }),
      );
      viderCacheMaintenance();
      return { ok: true, actif: false };
    } catch (erreur) {
      logErreur("supervision.maintenance.desactiver", erreur);
      return fail(500, { erreur: "Désactivation impossible." });
    }
  },
} satisfies Actions;
