import { json } from "@sveltejs/kit";
import { DrizzleFournisseurRepository } from "@/infrastructure/db/repositories/fournisseur-repository";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { cronAvecJournal } from "@/lib/server/cron-journal";
import { santeLogementFournisseur } from "@/lib/server/fournisseur-sante";
import { logErreur } from "@/lib/logger";
import type { RequestHandler } from "@sveltejs/kit";

const handler: RequestHandler = async ({ request }) => {
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
    // Une pause automatique (FR-023) sort l'affectation des actives : elle
    // n'apparaît plus dans la santé, donc on la rapporte à part — sinon la
    // sonde dirait « tout va bien » alors qu'une intégration est en panne.
    const pausesAutomatiques = logements
      .filter((logement) => logement.disjoncteurOuvertLe)
      .map((logement) => ({
        tenantId: logement.tenantId,
        logementId: logement.logementId,
        fournisseurCode: logement.fournisseurCode,
        echecsConsecutifs: logement.echecsConsecutifs ?? 0,
        disjoncteurOuvertLe: logement.disjoncteurOuvertLe,
      }));

    const enRetard = suivis.filter((entree) => entree.etat === "retard").length;
    const erreurs = suivis.filter((entree) => entree.etat === "erreur").length;
    const jamais = suivis.filter((entree) => entree.etat === "jamais").length;
    const ok =
      enRetard === 0 &&
      erreurs === 0 &&
      jamais === 0 &&
      pausesAutomatiques.length === 0;

    return json(
      {
        ok,
        total: suivis.length,
        enRetard,
        erreurs,
        jamais,
        pausesAutomatiques: pausesAutomatiques.length,
        logements: suivis,
        pauses: pausesAutomatiques,
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
// vérification du secret. Une sonde qui rapporte un fournisseur en panne a
// fait son travail : le 503 est un résultat normal, pas un échec de la
// tâche (c'est le fournisseur qui est en panne, pas le cron).
export const GET = cronAvecJournal("sante-fournisseurs", handler, {
  statutsSucces: [503],
  statutsIgnores: [503],
});
export const POST = GET;
