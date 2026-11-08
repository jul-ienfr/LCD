import { isRedirect, redirect } from "@sveltejs/kit";
import { DefinirPlageRestrictions } from "@/application/use-cases/definir-plage-restrictions";
import { DefinirPrixJour } from "@/application/use-cases/definir-prix-jour";
import { DefinirPrixPlage } from "@/application/use-cases/definir-prix-plage";
import { DefinirRestrictionSejour } from "@/application/use-cases/definir-restriction-sejour";
import {
  dateIsoValide,
  decalerMois,
  grilleMois,
  joursDuMois,
  moisCourant,
  moisEnFrancais,
  moisValide,
} from "@/domain/calendrier";
import { ErreurMetier } from "@/domain/erreurs";
import {
  ajustementPlanValide,
  codePlanValide,
  fusionnerRestrictionsPlan,
  fusionnerTarifsPlan,
  modePlanValide,
  nomPlanValide,
  prioritePlanValide,
} from "@/domain/plan-tarifaire";
import { decrireRestriction } from "@/domain/restriction-sejour";
import {
  AJUSTEMENT_STRATEGIE_PRIX,
  DESCRIPTIONS_STRATEGIE_PRIX,
  LIBELLES_STRATEGIE_PRIX,
  STRATEGIES_PRIX,
  appliquerStrategiePrix,
  strategiePrixValide,
} from "@/domain/strategie-prix";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePlanTarifaireRepository } from "@/infrastructure/db/repositories/plan-tarifaire-repository";
import { DrizzleRestrictionSejourRepository } from "@/infrastructure/db/repositories/restriction-sejour-repository";
import { DrizzleTarifRepository } from "@/infrastructure/db/repositories/tarif-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie, formaterEuros } from "@/lib/format";
import { traductionsPrix } from "@/lib/i18n-prix";
import { logErreur } from "@/lib/logger";
import { planifierSyncFournisseur } from "@/lib/server/fournisseur-outbox";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function moisLocalise(mois: string, langue: string): string {
  const libelle = new Intl.DateTimeFormat(langue, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${mois}-01T12:00:00Z`));
  return libelle.charAt(0).toUpperCase() + libelle.slice(1);
}

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function lien(
  mois: string,
  logementId: string,
  planTarifaireId?: string | null,
): string {
  const base = `/hote/prix?mois=${mois}&logement=${logementId}`;
  return planTarifaireId
    ? `${base}&plan=${encodeURIComponent(planTarifaireId)}`
    : base;
}

function entierOuNull(valeur: string): number | null {
  return valeur === "" ? null : Number(valeur);
}

function booleenOuNull(valeur: string): boolean | null {
  if (valeur === "true") return true;
  if (valeur === "false") return false;
  return null;
}

async function planDuFormulaire(
  donnees: FormData,
  tenantId: string,
  logementId: string,
) {
  const planId = texte(donnees, "planId");
  if (!planId) return null;
  const plan = await new DrizzlePlanTarifaireRepository().trouverParId(
    tenantId,
    planId,
  );
  if (!plan || plan.logementId !== logementId) {
    throw new ErreurMetier(
      "PLAN_TARIFAIRE_INVALIDE",
      "Plan tarifaire introuvable pour ce logement.",
    );
  }
  return plan;
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const langue = event.cookies.get("lcd_langue") ?? "fr";
  const moisParam = event.url.searchParams.get("mois");
  const mois = moisParam && moisValide(moisParam) ? moisParam : moisCourant();

  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);
  if (logements.length === 0) {
    return {
      t: traductionsPrix(langue),
      langue,
      vide: true,
      mois,
      moisLibelle: moisLocalise(mois, langue),
      logements: [],
      logement: null,
      jours: traductionsPrix(langue).jours,
      grille: [],
      tarifs: 0,
      restrictions: 0,
      cutoffJours: 0,
      bufferJours: 0,
      strategiePrix: "equilibre",
      strategies: STRATEGIES_PRIX.map((code) => ({
        code,
        libelle: LIBELLES_STRATEGIE_PRIX[code],
        description: DESCRIPTIONS_STRATEGIE_PRIX[code],
        ajustement: AJUSTEMENT_STRATEGIE_PRIX[code],
      })),
      plans: [],
      planId: "",
      planNom: "Tarif de base",
      dateDefaut: "",
      precedent: "",
      suivant: "",
      courant: "",
      ok: null,
      erreur: null,
      prix: null,
    };
  }

  const logement =
    logements.find((entree) => entree.id === event.url.searchParams.get("logement")) ??
    logements[0]!;
  const jours = joursDuMois(mois);
  const premier = jours[0]!;
  const dernier = jours[jours.length - 1]!;
  const plans = await new DrizzlePlanTarifaireRepository().listerParLogement(
    tenantId,
    logement.id,
  );
  const planParam = event.url.searchParams.get("plan");
  const plan = plans.find((entree) => entree.id === planParam) ?? null;
  const planTarifaireId = plan?.id ?? null;
  const [tarifsBase, restrictionsBase] = await Promise.all([
    new DrizzleTarifRepository().listerParMois(
      tenantId,
      logement.id,
      premier,
      dernier,
    ),
    new DrizzleRestrictionSejourRepository().listerParPeriode(
      tenantId,
      logement.id,
      premier,
      dernier,
    ),
  ]);
  let tarifs: { date: string; prixCentimes: number }[] = tarifsBase;
  let restrictions = restrictionsBase;
  if (plan) {
    const [tarifsPlan, restrictionsPlan] = await Promise.all([
      new DrizzleTarifRepository().listerParMois(
        tenantId,
        logement.id,
        premier,
        dernier,
        plan.id,
      ),
      new DrizzleRestrictionSejourRepository().listerParPeriode(
        tenantId,
        logement.id,
        premier,
        dernier,
        plan.id,
      ),
    ]);
    tarifs = fusionnerTarifsPlan(
      tarifsBase.map((tarif) => ({
        date: tarif.date,
        prixCentimes: tarif.prixCentimes,
      })),
      tarifsPlan.map((tarif) => ({
        date: tarif.date,
        prixCentimes: tarif.prixCentimes,
      })),
      plan.mode,
      plan.ajustementPourcentage,
    );
    restrictions = fusionnerRestrictionsPlan(
      restrictionsBase,
      restrictionsPlan,
      plan.mode === "derive" && plan.heriteRestrictions,
    );
  }
  const prixParDate = new Map(tarifs.map((tarif) => [tarif.date, tarif.prixCentimes]));
  const restrictionParDate = new Map(
    restrictions.map((restriction) => [restriction.date, restriction]),
  );
  const aujourdHui = new Date().toISOString().slice(0, 10);
  const dateParam = event.url.searchParams.get("date");
  const dateDefaut =
    dateParam && dateIsoValide(dateParam) && dateParam.startsWith(mois)
      ? dateParam
      : mois === aujourdHui.slice(0, 7)
        ? aujourdHui
        : premier;

  return {
    t: traductionsPrix(langue),
    langue,
    vide: false,
    mois,
    moisLibelle: moisLocalise(mois, langue),
    logements: logements.map((entree) => ({ id: entree.id, nom: entree.nom })),
    logement: { id: logement.id, nom: logement.nom, code: logement.code },
    plans: plans.map((entree) => ({
      id: entree.id,
      nom: entree.nom,
      code: entree.code,
      externalRatePlanId: entree.externalRatePlanId,
      mode: entree.mode,
      ajustementPourcentage: entree.ajustementPourcentage,
      heriteRestrictions: entree.heriteRestrictions,
      priorite: entree.priorite,
      actif: entree.actif,
    })),
    planId: planTarifaireId ?? "",
    planNom: plan?.nom ?? "Tarif de base",
    jours: traductionsPrix(langue).jours,
    grille: grilleMois(mois).map((semaine) =>
      semaine.map((date) =>
        date
          ? {
              date,
              jour: date.slice(8),
              prix:
                prixParDate.get(date) === undefined
                  ? "—"
                  : formaterEuros(prixParDate.get(date)!),
              regle: restrictionParDate.get(date)
                ? decrireRestriction(restrictionParDate.get(date)!)
                : null,
              lien: `${lien(mois, logement.id, planTarifaireId)}&date=${date}`,
            }
          : null,
      ),
    ),
    tarifs: tarifs.length,
    restrictions: restrictions.length,
    cutoffJours: logement.cutoffJours ?? 0,
    bufferJours: logement.bufferJours ?? 0,
    strategiePrix: logement.strategiePrix,
    strategies: STRATEGIES_PRIX.map((code) => ({
      code,
      libelle: LIBELLES_STRATEGIE_PRIX[code],
      description: DESCRIPTIONS_STRATEGIE_PRIX[code],
      ajustement: AJUSTEMENT_STRATEGIE_PRIX[code],
    })),
    dateDefaut,
    precedent: lien(decalerMois(mois, -1), logement.id, planTarifaireId),
    suivant: lien(decalerMois(mois, 1), logement.id, planTarifaireId),
    courant: lien(moisCourant(), logement.id, planTarifaireId),
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
    prix: event.url.searchParams.get("prix"),
  };
};

export const actions = {
  strategie: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const planId = texte(donnees, "planId") || null;
    const moisParam = texte(donnees, "mois");
    const mois = moisValide(moisParam) ? moisParam : moisCourant();
    const strategie = texte(donnees, "strategiePrix");

    if (!strategiePrixValide(strategie)) {
      redirect(303, `${lien(mois, logementId, planId)}&erreur=strategie`);
    }

    try {
      const logement = await new DrizzleLogementRepository().definirStrategiePrix(
        tenantId,
        logementId,
        strategie,
      );
      if (!logement) {
        redirect(303, `${lien(mois, logementId, planId)}&erreur=logement`);
      }

      let prixAppliques = 0;
      if (texte(donnees, "appliquerAuxPrix") === "oui") {
        const jours = joursDuMois(mois);
        const premier = jours[0]!;
        const dernier = jours[jours.length - 1]!;
        const existants = await new DrizzleTarifRepository().listerParMois(
          tenantId,
          logementId,
          premier,
          dernier,
          planId,
        );
        if (existants.length > 0) {
          await new DrizzleTarifRepository().definirPlusieurs(
            existants.map((tarif) => ({
              tenantId,
              logementId,
              planTarifaireId: tarif.planTarifaireId,
              date: tarif.date,
              prixCentimes: appliquerStrategiePrix(
                tarif.prixCentimes,
                strategie,
              ),
              source: "strategie",
            })),
          );
          prixAppliques = existants.length;
        }
      }

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "logement.strategie_prix",
          cible: logement.id,
          ref: strategie,
          payload: {
            strategie,
            ajustement: AJUSTEMENT_STRATEGIE_PRIX[strategie],
            prixAppliques,
            mois,
          },
        }),
      );
      planifierSyncFournisseur(tenantId, logementId);
      redirect(
        303,
        `${lien(mois, logementId, planId)}&ok=strategie&prix=${prixAppliques}`,
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("prix.strategie", error, { tenantId, logementId, strategie });
      redirect(303, `${lien(mois, logementId, planId)}&erreur=inattendu`);
    }
  },

  definir: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const planId = texte(donnees, "planId") || null;
    const date = texte(donnees, "date");
    const mois = date.slice(0, 7);
    const prixCentimes = centimesDepuisSaisie(texte(donnees, "prixEuros"));
    const supplementSaisi = texte(donnees, "prixParPersonneEuros").trim();
    const supplementCentimes = supplementSaisi
      ? centimesDepuisSaisie(supplementSaisi)
      : null;
    const personnesIncluses = Number(texte(donnees, "personnesIncluses") || "2");

    if (prixCentimes === null || (supplementSaisi && supplementCentimes === null)) {
      redirect(303, `${lien(mois, logementId, planId)}&erreur=prix`);
    }

    try {
      const logement = await new DrizzleLogementRepository().trouverParId(
        tenantId,
        logementId,
      );
      if (!logement) {
        redirect(303, `${lien(mois, logementId, planId)}&erreur=logement`);
      }
      const plan = await planDuFormulaire(donnees, tenantId, logementId);

      const tarif = await new DefinirPrixJour(new DrizzleTarifRepository()).executer({
        tenantId,
        logementId,
        planTarifaireId: plan?.id ?? null,
        date,
        prixCentimes,
        prixParPersonneCentimes: supplementCentimes,
        personnesIncluses,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "tarif.definir",
          cible: logement.id,
          ref: tarif.date,
          payload: {
            prixCentimes: tarif.prixCentimes,
            prixParPersonneCentimes: tarif.prixParPersonneCentimes,
            personnesIncluses: tarif.personnesIncluses,
            source: tarif.source,
            planTarifaireId: plan?.id ?? null,
          },
        }),
      );
      planifierSyncFournisseur(tenantId, logementId);
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          `${lien(mois, logementId, planId)}&erreur=${encodeURIComponent(error.message)}`,
        );
      }
      logErreur("prix.definir", error, { tenantId, logementId, date });
      redirect(303, `${lien(mois, logementId, planId)}&erreur=inattendu`);
    }

    redirect(
      303,
      `${lien(mois, logementId, planId)}&ok=${encodeURIComponent(date)}`,
    );
  },

  definirPrixPlage: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const planId = texte(donnees, "planId") || null;
    const dateDebut = texte(donnees, "dateDebutPrix");
    const dateFin = texte(donnees, "dateFinPrix");
    const mois = dateDebut.slice(0, 7) || moisCourant();
    const prixCentimes = centimesDepuisSaisie(texte(donnees, "prixPlageEuros"));
    const supplementPlageSaisi = texte(donnees, "prixParPersonnePlageEuros").trim();
    const supplementPlageCentimes = supplementPlageSaisi
      ? centimesDepuisSaisie(supplementPlageSaisi)
      : null;
    const personnesInclusesPlage = Number(
      texte(donnees, "personnesInclusesPlage") || "2",
    );
    const joursSemaine = donnees.getAll("joursSemaine").map(Number);

    if (
      prixCentimes === null ||
      (supplementPlageSaisi && supplementPlageCentimes === null)
    ) {
      redirect(303, `${lien(mois, logementId, planId)}&erreur=prix`);
    }

    try {
      const logement = await new DrizzleLogementRepository().trouverParId(
        tenantId,
        logementId,
      );
      if (!logement) {
        redirect(303, `${lien(mois, logementId, planId)}&erreur=logement`);
      }
      const plan = await planDuFormulaire(donnees, tenantId, logementId);
      const resultat = await new DefinirPrixPlage(
        new DrizzleTarifRepository(),
      ).executer({
        tenantId,
        logementId,
        planTarifaireId: plan?.id ?? null,
        dateDebut,
        dateFin,
        joursSemaine,
        prixCentimes,
        prixParPersonneCentimes: supplementPlageCentimes,
        personnesIncluses: personnesInclusesPlage,
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "tarif.plage",
          cible: logement.id,
          ref: `${dateDebut}/${dateFin}`,
          payload: {
            prixCentimes,
            prixParPersonneCentimes: supplementPlageCentimes,
            personnesIncluses: personnesInclusesPlage,
            dates: resultat.dates.length,
            joursSemaine,
            planTarifaireId: plan?.id ?? null,
          },
        }),
      );
      planifierSyncFournisseur(tenantId, logementId);
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          `${lien(mois, logementId, planId)}&erreur=${encodeURIComponent(error.message)}`,
        );
      }
      logErreur("prix.plage", error, {
        tenantId,
        logementId,
        dateDebut,
        dateFin,
      });
      redirect(303, `${lien(mois, logementId, planId)}&erreur=inattendu`);
    }

    redirect(303, `${lien(mois, logementId, planId)}&ok=prix-plage`);
  },

  definirCutoff: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const planId = texte(donnees, "planId") || null;
    const moisParam = texte(donnees, "mois");
    const mois = moisValide(moisParam) ? moisParam : moisCourant();
    const valeur = texte(donnees, "cutoffJours");
    const jours = valeur === "" ? 0 : Number(valeur);

    if (!Number.isInteger(jours) || jours < 0 || jours > 365) {
      redirect(303, `${lien(mois, logementId, planId)}&erreur=cutoff`);
    }

    try {
      const logement = await new DrizzleLogementRepository().definirCutoff(
        tenantId,
        logementId,
        jours,
      );
      if (!logement) {
        redirect(303, `${lien(mois, logementId, planId)}&erreur=logement`);
      }
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "logement.cutoff",
          cible: logement.id,
          ref: String(jours),
          payload: { cutoffJours: jours },
        }),
      );
      planifierSyncFournisseur(tenantId, logementId);
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("prix.cutoff", error, { tenantId, logementId });
      redirect(303, `${lien(mois, logementId, planId)}&erreur=inattendu`);
    }

    redirect(303, `${lien(mois, logementId, planId)}&ok=cutoff`);
  },

  definirBuffer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const planId = texte(donnees, "planId") || null;
    const moisParam = texte(donnees, "mois");
    const mois = moisValide(moisParam) ? moisParam : moisCourant();
    const valeur = texte(donnees, "bufferJours");
    const jours = valeur === "" ? 0 : Number(valeur);

    if (!Number.isInteger(jours) || jours < 0 || jours > 7) {
      redirect(303, `${lien(mois, logementId, planId)}&erreur=buffer`);
    }

    try {
      const logement = await new DrizzleLogementRepository().definirBuffer(
        tenantId,
        logementId,
        jours,
      );
      if (!logement) {
        redirect(303, `${lien(mois, logementId, planId)}&erreur=logement`);
      }
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "logement.buffer",
          cible: logement.id,
          ref: String(jours),
          payload: { bufferJours: jours },
        }),
      );
      planifierSyncFournisseur(tenantId, logementId);
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("prix.buffer", error, { tenantId, logementId });
      redirect(303, `${lien(mois, logementId, planId)}&erreur=inattendu`);
    }

    redirect(303, `${lien(mois, logementId, planId)}&ok=buffer`);
  },

  restriction: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const planId = texte(donnees, "planId") || null;
    const date = texte(donnees, "dateRegle");
    const dateFin = texte(donnees, "dateFinRegle");
    const joursSemaine = donnees.getAll("joursSemaine").map(Number);
    const mois = date.slice(0, 7);
    if (
      joursSemaine.some(
        (jour) => !Number.isInteger(jour) || jour < 1 || jour > 7,
      )
    ) {
      redirect(
        303,
        `${lien(mois, logementId, planId)}&erreur=${encodeURIComponent("Jours de semaine invalides.")}`,
      );
    }
    const supprimer = texte(donnees, "supprimer") === "1";
    const valeurs = supprimer
      ? {
          sejourMin: null,
          sejourMax: null,
          arriveeAutorisee: null,
          departAutorisee: null,
          stopSell: null,
        }
      : {
          sejourMin: entierOuNull(texte(donnees, "sejourMin")),
          sejourMax: entierOuNull(texte(donnees, "sejourMax")),
          arriveeAutorisee: booleenOuNull(texte(donnees, "arriveeAutorisee")),
          departAutorisee: booleenOuNull(texte(donnees, "departAutorisee")),
          stopSell: booleenOuNull(texte(donnees, "stopSell")),
        };
    let supprimee = supprimer;

    try {
      const logement = await new DrizzleLogementRepository().trouverParId(
        tenantId,
        logementId,
      );
      if (!logement) {
        redirect(303, `${lien(mois, logementId, planId)}&erreur=logement`);
      }
      const plan = await planDuFormulaire(donnees, tenantId, logementId);

      const repository = new DrizzleRestrictionSejourRepository();
      if (dateFin) {
        const resultat = await new DefinirPlageRestrictions(
          repository,
        ).executer({
          tenantId,
          logementId,
          planTarifaireId: plan?.id ?? null,
          dateDebut: date,
          dateFin,
          joursSemaine,
          ...valeurs,
        });
        supprimee = resultat.supprimees > 0;
        await withTenant(tenantId, (tx) =>
          tx.insert(auditLogs).values({
            tenantId,
            qui: session.user.email,
            action: supprimee ? "restriction.supprimer" : "restriction.definir",
            cible: logement.id,
            ref: `${date}/${dateFin}`,
            payload: {
              ...valeurs,
              joursSemaine,
              dates: resultat.dates.length,
              planTarifaireId: plan?.id ?? null,
            },
          }),
        );
      } else {
        const restriction = await new DefinirRestrictionSejour(
          repository,
        ).executer({
          tenantId,
          logementId,
          planTarifaireId: plan?.id ?? null,
          date,
          ...valeurs,
        });
        supprimee = restriction === null;
        await withTenant(tenantId, (tx) =>
          tx.insert(auditLogs).values({
            tenantId,
            qui: session.user.email,
            action: supprimee
              ? "restriction.supprimer"
              : "restriction.definir",
            cible: logement.id,
            ref: date,
            payload: { ...valeurs, planTarifaireId: plan?.id ?? null },
          }),
        );
      }
      planifierSyncFournisseur(tenantId, logementId);
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          `${lien(mois, logementId, planId)}&erreur=${encodeURIComponent(error.message)}`,
        );
      }
      logErreur("prix.restriction", error, { tenantId, logementId, date });
      redirect(303, `${lien(mois, logementId, planId)}&erreur=inattendu`);
    }

    const ok = dateFin
      ? supprimee
        ? "restriction-supprimee-plage"
        : "restriction-plage"
      : supprimee
        ? "restriction-supprimee"
        : "restriction";
    redirect(303, `${lien(mois, logementId, planId)}&ok=${ok}`);
  },

  creerPlan: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const moisParam = texte(donnees, "mois");
    const mois = moisValide(moisParam) ? moisParam : moisCourant();
    const nom = texte(donnees, "nom");
    const code = texte(donnees, "code").toLowerCase();
    const externalRatePlanId =
      texte(donnees, "externalRatePlanId") || null;
    const mode = texte(donnees, "mode") || "independant";
    const ajustementPourcentage = Number(
      texte(donnees, "ajustementPourcentage") || "0",
    );
    const heriteRestrictions =
      texte(donnees, "heriteRestrictions") === "true" ||
      donnees.get("heriteRestrictions") === "on";
    const priorite = Number(texte(donnees, "priorite") || "0");

    if (
      !nomPlanValide(nom) ||
      !codePlanValide(code) ||
      !modePlanValide(mode) ||
      !ajustementPlanValide(ajustementPourcentage) ||
      !prioritePlanValide(priorite)
    ) {
      redirect(303, `${lien(mois, logementId)}&erreur=plan`);
    }

    try {
      const logement = await new DrizzleLogementRepository().trouverParId(
        tenantId,
        logementId,
      );
      if (!logement) {
        redirect(303, `${lien(mois, logementId)}&erreur=logement`);
      }
      const plan = await new DrizzlePlanTarifaireRepository().creer({
        tenantId,
        logementId,
        nom,
        code,
        externalRatePlanId,
        mode,
        ajustementPourcentage,
        heriteRestrictions,
        priorite,
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "plan.creer",
          cible: plan.id,
          ref: plan.code,
          payload: {
            logementId,
            nom: plan.nom,
            externalRatePlanId: plan.externalRatePlanId,
            mode: plan.mode,
            ajustementPourcentage: plan.ajustementPourcentage,
            heriteRestrictions: plan.heriteRestrictions,
            priorite: plan.priorite,
          },
        }),
      );
      planifierSyncFournisseur(tenantId, logementId);
      redirect(303, `${lien(mois, logementId, plan.id)}&ok=plan-cree`);
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          `${lien(mois, logementId)}&erreur=${encodeURIComponent(error.message)}`,
        );
      }
      logErreur("prix.creer-plan", error, { tenantId, logementId });
      redirect(303, `${lien(mois, logementId)}&erreur=inattendu`);
    }
  },

  modifierPlan: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const planId = texte(donnees, "planId");
    const moisParam = texte(donnees, "mois");
    const mois = moisValide(moisParam) ? moisParam : moisCourant();

    try {
      const plan = await planDuFormulaire(donnees, tenantId, logementId);
      if (!plan) {
        redirect(303, `${lien(mois, logementId)}&erreur=plan`);
      }
      const nom = texte(donnees, "nom");
      const externalRatePlanId =
        texte(donnees, "externalRatePlanId") || null;
      const mode = texte(donnees, "mode") || plan.mode;
      const ajustementPourcentage = Number(
        texte(donnees, "ajustementPourcentage") || "0",
      );
      const heriteRestrictions =
        texte(donnees, "heriteRestrictions") === "true" ||
        donnees.get("heriteRestrictions") === "on";
      const priorite = Number(texte(donnees, "priorite") || "0");
      if (
        !nomPlanValide(nom) ||
        !modePlanValide(mode) ||
        !ajustementPlanValide(ajustementPourcentage) ||
        !prioritePlanValide(priorite)
      ) {
        redirect(
          303,
          `${lien(mois, logementId, plan.id)}&erreur=plan`,
        );
      }
      await new DrizzlePlanTarifaireRepository().mettreAJour(
        tenantId,
        plan.id,
        {
          nom,
          externalRatePlanId,
          mode,
          ajustementPourcentage,
          heriteRestrictions,
          priorite,
        },
      );
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "plan.modifier",
          cible: plan.id,
          ref: plan.code,
          payload: {
            nom,
            externalRatePlanId,
            mode,
            ajustementPourcentage,
            heriteRestrictions,
            priorite,
          },
        }),
      );
      planifierSyncFournisseur(tenantId, logementId);
      redirect(303, `${lien(mois, logementId, plan.id)}&ok=plan-modifie`);
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          `${lien(mois, logementId, planId || null)}&erreur=${encodeURIComponent(error.message)}`,
        );
      }
      logErreur("prix.modifier-plan", error, { tenantId, logementId, planId });
      redirect(303, `${lien(mois, logementId)}&erreur=inattendu`);
    }
  },

  basculerPlan: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const planId = texte(donnees, "planId");
    const moisParam = texte(donnees, "mois");
    const mois = moisValide(moisParam) ? moisParam : moisCourant();
    const actif = texte(donnees, "actif") === "1";

    try {
      const plan = await planDuFormulaire(donnees, tenantId, logementId);
      if (!plan) {
        redirect(303, `${lien(mois, logementId)}&erreur=plan`);
      }
      await new DrizzlePlanTarifaireRepository().mettreAJour(
        tenantId,
        plan.id,
        { actif: !actif },
      );
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "plan.basculer",
          cible: plan.id,
          ref: plan.code,
          payload: { actif: !actif },
        }),
      );
      planifierSyncFournisseur(tenantId, logementId);
      redirect(303, `${lien(mois, logementId, plan.id)}&ok=plan-modifie`);
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          `${lien(mois, logementId, planId || null)}&erreur=${encodeURIComponent(error.message)}`,
        );
      }
      logErreur("prix.basculer-plan", error, { tenantId, logementId, planId });
      redirect(303, `${lien(mois, logementId)}&erreur=inattendu`);
    }
  },

  supprimerPlan: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const planId = texte(donnees, "planId");
    const moisParam = texte(donnees, "mois");
    const mois = moisValide(moisParam) ? moisParam : moisCourant();

    try {
      const plan = await planDuFormulaire(donnees, tenantId, logementId);
      if (!plan) {
        redirect(303, `${lien(mois, logementId)}&erreur=plan`);
      }
      await new DrizzlePlanTarifaireRepository().supprimer(tenantId, plan.id);
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "plan.supprimer",
          cible: plan.id,
          ref: plan.code,
          payload: { nom: plan.nom },
        }),
      );
      planifierSyncFournisseur(tenantId, logementId);
      redirect(303, `${lien(mois, logementId)}&ok=plan-supprime`);
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          `${lien(mois, logementId, planId || null)}&erreur=${encodeURIComponent(error.message)}`,
        );
      }
      logErreur("prix.supprimer-plan", error, { tenantId, logementId, planId });
      redirect(303, `${lien(mois, logementId)}&erreur=inattendu`);
    }
  },
} satisfies Actions;
