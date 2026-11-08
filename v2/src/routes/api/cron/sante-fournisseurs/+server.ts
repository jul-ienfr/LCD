import { json } from "@sveltejs/kit";
import { DrizzleFournisseurRepository } from "@/infrastructure/db/repositories/fournisseur-repository";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { santeLogementFournisseur } from "@/lib/server/fournisseur-sante";
import { logErreur } from "@/lib/logger";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request }) => {
  if (!env.CRON_SECRET) {
    return json(
      { ok: false, erreur: "CRON_SECRET non configuré." },
      { status: 503 },
    );
  }
  if (!cronSecretValide(request.headers.get("authorization"), env.CRON_SECRET)) {
    return json({ ok: false, erreur: "Non autorisé." }, { status: 401 });
  }

  try {
    const logements =
      await new DrizzleFournisseurRepository().listerLogementsAvecFournisseur();
    if (logements === null) {
      return json(
        {
          ok: false,
          erreur: "Connexion owner indisponible.",
          ownerDisponible: false,
        },
        { status: 503 },
      );
    }

    const maintenant = new Date();
    const suivis = logements.flatMap((logement) => {
      const sante = santeLogementFournisseur(logement, maintenant);
      if (!sante) return [];
      return [
        {
          tenantId: logement.tenantId,
          logementId: logement.logementId,
          fournisseurCode: logement.fournisseurCode,
          etat: sante.etat,
          ageMinutes: sante.ageMinutes,
          seuilMinutes: sante.seuilMinutes,
          derniereSync: logement.derniereSync,
          dernierStatut: logement.dernierStatut,
        },
      ];
    });

    const enRetard = suivis.filter((entree) => entree.etat === "retard").length;
    const erreurs = suivis.filter((entree) => entree.etat === "erreur").length;
    const jamais = suivis.filter((entree) => entree.etat === "jamais").length;
    const ok = enRetard === 0 && erreurs === 0 && jamais === 0;

    return json(
      {
        ok,
        total: suivis.length,
        enRetard,
        erreurs,
        jamais,
        logements: suivis,
      },
      { status: ok ? 200 : 503 },
    );
  } catch (error) {
    logErreur("cronSanteFournisseurs", error);
    return json(
      { ok: false, erreur: "Erreur pendant le contrôle de santé." },
      { status: 500 },
    );
  }
};

// Les planificateurs externes utilisent GET ou POST : même handler, même
// vérification du secret.
export const POST = GET;
