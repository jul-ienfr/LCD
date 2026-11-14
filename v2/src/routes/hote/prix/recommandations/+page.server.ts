import { redirect } from "@sveltejs/kit";
import { AppliquerRecommandation } from "@/application/use-cases/appliquer-recommandation";
import { ImporterRecommandations } from "@/application/use-cases/importer-recommandations";
import {
  BORNES_PRIX_DEFAUT,
  ecartPourcent,
  resumerFacteurs,
  validerBornesPrix,
} from "@/domain/recommandation-prix";
import { ErreurMetier, type CodeErreurMetier } from "@/domain/erreurs";
import { creerPricingLocal } from "@/infrastructure/adapters/pricing-local";
import { creerPricingPriceLabs } from "@/infrastructure/adapters/pricing-pricelabs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleRecommandationsPrixRepository } from "@/infrastructure/db/repositories/recommandations-prix-repository";
import { DrizzleTarifRepository } from "@/infrastructure/db/repositories/tarif-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { formaterEuros } from "@/lib/format";
import { jourParis } from "@/lib/date-paris";
import { logErreur } from "@/lib/logger";
import { donneesPeriode } from "@/lib/server/planificateur-pricing";
import {
  ecartCumuleDecisions,
  indicateursPeriode,
} from "@/domain/performance-prix";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const STATUTS = ["proposee", "appliquee", "ignoree"] as const;

function texte(donnees: FormData, cle: string): string {
  const valeur = donnees.get(cle);
  return typeof valeur === "string" ? valeur.trim() : "";
}

function ajouterJours(jour: string, jours: number): string {
  const date = new Date(`${jour}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + jours);
  return date.toISOString().slice(0, 10);
}

interface LogementSimple {
  id: string;
  nom: string;
}

/**
 * Compare le RevPAR réalisé des 30 derniers jours (base avant décision) au
 * RevPAR des 30 prochains jours recalculé avec les prix appliqués par le
 * partenaire. L'occupation future n'étant pas connue, la projection réutilise
 * le taux d'occupation réalisé : c'est une estimation, affichée comme telle.
 */
async function construireComparaisonRevPar(
  tenantId: string,
  logements: readonly LogementSimple[],
  aujourdHui: string,
  decisions: readonly {
    prixActuelCentimes: number | null;
    prixAppliqueCentimes: number;
  }[],
) {
  const avantDebut = ajouterJours(aujourdHui, -30);
  const apresFin = ajouterJours(aujourdHui, 30);
  const lignes: {
    logementId: string;
    logementNom: string;
    revParAvant: string | null;
    revParApres: string | null;
    ecartPourcent: number | null;
    comparable: boolean;
  }[] = [];

  for (const logement of logements.slice(0, 20)) {
    const avant = await donneesPeriode(tenantId, logement.id, avantDebut, aujourdHui);
    const indicateursAvant = indicateursPeriode(avant);
    const revParAvant = indicateursAvant.revParCentimes ?? 0;
    // Projection : mêmes nuits vendues qu'en réalisé, prix appliqués.
    const ecart = ecartCumuleDecisions(decisions);
    const joursRetenus = decisions.filter(
      (decision) => decision.prixActuelCentimes !== null,
    ).length;
    const revParApres =
      avant.jours === 0
        ? null
        : Math.round(revParAvant + ecart.ecartCentimes / avant.jours);
    lignes.push({
      logementId: logement.id,
      logementNom: logement.nom,
      revParAvant:
        indicateursAvant.revParCentimes === null
          ? null
          : formaterEuros(indicateursAvant.revParCentimes),
      revParApres: revParApres === null ? null : formaterEuros(revParApres),
      ecartPourcent:
        revParAvant === 0 || revParApres === null || joursRetenus === 0
          ? null
          : Math.round(((revParApres - revParAvant) * 1000) / revParAvant) / 10,
      comparable: avant.jours > 0 && joursRetenus > 0,
    });
  }
  return {
    periode:
      lignes.length === 0
        ? null
        : { avant: `${avantDebut} → ${aujourdHui}`, apres: `${aujourdHui} → ${apresFin}` },
    lignes,
    decisionsAppliquees: decisions.length,
    estimation: true,
  };
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote", "operateur"]);
  const tenantId = tenantIdDeSession(session);
  const aujourdHui = jourParis();
  const debut = event.url.searchParams.get("debut") ?? aujourdHui;
  const fin = event.url.searchParams.get("fin") ?? ajouterJours(debut, 90);
  const statutParam = event.url.searchParams.get("statut") ?? "proposee";
  const statut = (STATUTS as readonly string[]).includes(statutParam)
    ? (statutParam as (typeof STATUTS)[number])
    : "proposee";

  const depot = new DrizzleRecommandationsPrixRepository();
  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);
  const recommandations = await depot.listerParPlage(tenantId, {
    debut,
    fin,
    statut,
  });
  const parLogement = new Map(logements.map((l) => [l.id, l]));

  const lignes = recommandations.map((ligne) => ({
    id: ligne.id,
    jour: ligne.jour,
    logementNom: parLogement.get(ligne.logementId)?.nom ?? "Logement inconnu",
    logementId: ligne.logementId,
    prixActuel: ligne.prixActuelCentimes,
    prixActuelAffiche:
      ligne.prixActuelCentimes === null
        ? "—"
        : formaterEuros(ligne.prixActuelCentimes),
    prixRecommande: formaterEuros(ligne.prixRecommandeCentimes),
    ecart: ecartPourcent(ligne.prixActuelCentimes, ligne.prixRecommandeCentimes),
    source: ligne.source,
    confiance: ligne.confiance,
    facteurs: ligne.facteurs,
    explication: resumerFacteurs(ligne.facteurs),
    statut: ligne.statut,
    importeeLe: ligne.importeeLe,
  }));

  const priceLabs = creerPricingPriceLabs();
  const appliquees = await depot.listerParPlage(tenantId, {
    debut,
    fin,
    statut: "appliquee",
  });
  const comparaisonRevPar = await construireComparaisonRevPar(
    tenantId,
    logements,
    aujourdHui,
    appliquees.map((ligne) => ({
      prixActuelCentimes: ligne.prixActuelCentimes,
      prixAppliqueCentimes: ligne.prixRecommandeCentimes,
    })),
  );
  return {
    aujourdHui,
    debut,
    fin,
    statut,
    statuts: STATUTS,
    messageOk: event.url.searchParams.get("ok"),
    messageErreur: event.url.searchParams.get("erreur"),
    joursImportes: event.url.searchParams.get("jours"),
    prixApplique: event.url.searchParams.get("prix"),
    prixBorne: event.url.searchParams.get("borne") === "1",
    lignes,
    logements: logements.map((l) => ({ id: l.id, nom: l.nom, code: l.code })),
    bornes: BORNES_PRIX_DEFAUT,
    bornesAffichees: {
      min: formaterEuros(BORNES_PRIX_DEFAUT.minCentimes),
      max: formaterEuros(BORNES_PRIX_DEFAUT.maxCentimes),
    },
    comparaisonRevPar,
    partenaires: [
      {
        nom: priceLabs.nom,
        disponible: priceLabs.estDisponible(),
        source: priceLabs.source,
      },
      {
        nom: "Recommandation locale (occupation)",
        disponible: true,
        source: "local" as const,
      },
    ],
    total: lignes.length,
  };
};

export const actions = {
  importer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const debut = texte(donnees, "debut") || jourParis();
    const horizon = Number(texte(donnees, "horizon"));
    const fin =
      Number.isInteger(horizon) && horizon > 0
        ? ajouterJours(debut, Math.min(horizon, 730))
        : texte(donnees, "fin") || ajouterJours(debut, 90);
    const lien = `/hote/prix/recommandations?debut=${debut}&fin=${fin}`;

    if (!logementId) redirect(303, `${lien}&erreur=logement`);

    const logement = (await new DrizzleLogementRepository().listerParTenant(tenantId)).find(
      (l) => l.id === logementId,
    );
    if (!logement) redirect(303, `${lien}&erreur=logement`);

    const priceLabs = creerPricingPriceLabs();
    const local = creerPricingLocal({
      lirePrixCatalogue: async (demande) => {
        const tarifs = await new DrizzleTarifRepository().listerParMois(
          tenantId,
          demande.logementId,
          demande.debut,
          demande.fin,
        );
        return new Map(tarifs.map((tarif) => [tarif.date, tarif.prixCentimes]));
      },
      tauxOccupation: async () => 0.5,
    });

    let destination: string;
    try {
      const importateur = new ImporterRecommandations(
        new DrizzleRecommandationsPrixRepository(),
        new DrizzleTarifRepository(),
        [priceLabs, local],
      );
      const resultat = await importateur.executer({
        tenantId,
        logementId,
        referencePartenaire: logement.code,
        debut,
        fin,
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "prix.recommandations-importees",
          cible: logementId,
          payload: { ...resultat },
        }),
      );
      destination = `${lien}&ok=import&jours=${resultat.joursImportes}`;
    } catch (erreur) {
      const code = erreur instanceof ErreurMetier ? erreur.code : "PRICING_INDISPONIBLE";
      logErreur("pricing.import.ecran", erreur, { tenantId, logementId });
      destination = `${lien}&erreur=${code}`;
    }
    redirect(303, destination);
  },

  appliquer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const recommandationId = texte(donnees, "recommandationId");
    const debut = texte(donnees, "debut") || jourParis();
    const fin = texte(donnees, "fin") || ajouterJours(debut, 90);
    const retour = `/hote/prix/recommandations?debut=${debut}&fin=${fin}`;
    const min = Number(texte(donnees, "minCentimes"));
    const max = Number(texte(donnees, "maxCentimes"));
    const bornes =
      Number.isInteger(min) && Number.isInteger(max) && min > 0 && max > min
        ? validerBornesPrix({ minCentimes: min, maxCentimes: max })
        : BORNES_PRIX_DEFAUT;

    let destination: string;
    try {
      const appliqueur = new AppliquerRecommandation({
        recommandations: new DrizzleRecommandationsPrixRepository(),
        tarifs: new DrizzleTarifRepository(),
        tracer: async (entree) => {
          await withTenant(tenantId, (tx) =>
            tx.insert(auditLogs).values({
              tenantId,
              qui: session.user.email,
              action: entree.action,
              cible: entree.cible,
              payload: entree.details,
            }),
          );
        },
      });
      const resultat = await appliqueur.executer({
        tenantId,
        recommandationId,
        par: session.user.email,
        bornes,
        pousserCanal: true,
      });
      const parametres = new URLSearchParams({
        ok: "applique",
        prix: String(resultat.prixAppliqueCentimes),
      });
      if (resultat.prixBorne) parametres.set("borne", "1");
      destination = `${retour}&${parametres.toString()}`;
    } catch (erreur) {
      const code: CodeErreurMetier =
        erreur instanceof ErreurMetier ? erreur.code : "RECOMMANDATION_INVALIDE";
      logErreur("pricing.application", erreur, { tenantId, recommandationId });
      destination = `${retour}&erreur=${code}`;
    }
    redirect(303, destination);
  },

  ignorer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const recommandationId = texte(donnees, "recommandationId");
    const debut = texte(donnees, "debut") || jourParis();
    const fin = texte(donnees, "fin") || ajouterJours(debut, 90);
    const retour = `/hote/prix/recommandations?debut=${debut}&fin=${fin}`;

    const resultat = await new DrizzleRecommandationsPrixRepository().marquerStatut(
      tenantId,
      recommandationId,
      "ignoree",
      session.user.email,
    );
    if (!resultat) {
      redirect(303, `${retour}&erreur=RECOMMANDATION_INVALIDE`);
    }
    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "prix.recommandation-ignoree",
        cible: recommandationId,
        payload: { jour: resultat.jour, logementId: resultat.logementId },
      }),
    );
    redirect(303, `${retour}&ok=ignore`);
  },
};
