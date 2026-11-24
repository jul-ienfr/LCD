import { fail, redirect } from "@sveltejs/kit";
import { ErreurMetier } from "@/domain/erreurs";
import {
  configurationSuiviVide,
  validerConfigurationSuivi,
} from "@/domain/suivi";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleSuiviRepository } from "@/infrastructure/db/repositories/suivi-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { exigerConfirmation } from "@/lib/server/confirmation";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";
import { langueRequete } from "@/lib/server/langue";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function nombre(donnees: FormData, nom: string): string | null {
  const valeur = texte(donnees, nom);
  return valeur === "" ? null : valeur;
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const repo = new DrizzleSuiviRepository();
  const [configuration, evenements, resume] = await Promise.all([
    repo.lireConfiguration(tenantId),
    repo.listerEvenements(tenantId, { limite: 100 }),
    repo.resume(
      tenantId,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1_000).toISOString(),
    ),
  ]);
  return {
    langue: langueRequete(event),
    configuration: configuration ?? configurationSuiviVide(),
    evenements,
    resume,
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions: Actions = {
  enregistrer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    let configuration;
    try {
      configuration = validerConfigurationSuivi({
        actif: donnees.get("actif") === "1",
        mesure: {
          ga4Id: texte(donnees, "ga4Id"),
          matomoUrl: texte(donnees, "matomoUrl"),
          matomoSiteId: nombre(donnees, "matomoSiteId"),
          plausibleDomain: texte(donnees, "plausibleDomain"),
        },
        publicite: {
          metaPixelId: nombre(donnees, "metaPixelId"),
          googleAdsId: texte(donnees, "googleAdsId"),
          tiktokPixelId: texte(donnees, "tiktokPixelId"),
        },
      });
    } catch (error) {
      if (error instanceof ErreurMetier) {
        return fail(400, { erreur: error.message });
      }
      throw error;
    }

    const repo = new DrizzleSuiviRepository();
    await repo.enregistrerConfiguration(tenantId, configuration);
    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "suivi.configuration",
        cible: tenantId,
        ref: "suivi",
        payload: {
          actif: configuration.actif,
          mesure: Object.fromEntries(
            Object.entries(configuration.mesure).map(([cle, valeur]) => [
              cle,
              Boolean(valeur),
            ]),
          ),
          publicite: Object.fromEntries(
            Object.entries(configuration.publicite).map(([cle, valeur]) => [
              cle,
              Boolean(valeur),
            ]),
          ),
        },
      }),
    );
    redirect(303, "/hote/suivi?ok=1");
  },

  purger: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    // Deux étapes (FR-039) : sans `confirmation`, rien n'est purgé.
    exigerConfirmation(donnees, {
      action: "purger",
      retour: "/hote/suivi",
      cible: "purger",
    });
    const avant = new Date(
      Date.now() - 396 * 24 * 60 * 60 * 1_000,
    ).toISOString();
    const supprimes = await new DrizzleSuiviRepository().purgerAvant(
      tenantId,
      avant,
    );
    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "suivi.purge",
        cible: tenantId,
        ref: avant.slice(0, 10),
        payload: { supprimes, avant },
      }),
    );
    redirect(303, `/hote/suivi?ok=${supprimes}`);
  },
};
