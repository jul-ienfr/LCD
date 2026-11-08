import { fail, isRedirect, redirect } from "@sveltejs/kit";
import { EnregistrerFluxIcs } from "@/application/use-cases/enregistrer-flux-ics";
import { ImporterIcs, type ResultatImportIcs } from "@/application/use-cases/importer-ics";
import { SynchroniserFluxIcs } from "@/application/use-cases/synchroniser-flux-ics";
import { ErreurMetier } from "@/domain/erreurs";
import { fluxEnRetard } from "@/domain/flux-ics";
import { creerRecuperateurIcs } from "@/infrastructure/adapters/recuperateur-ics";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleFluxIcsRepository } from "@/infrastructure/db/repositories/flux-ics-repository";
import { DrizzleImportIcsRepository } from "@/infrastructure/db/repositories/import-ics-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { creerTokenCalendrier } from "@/lib/calendrier-token";
import { env } from "@/lib/env";
import { traductionsPlanningImport } from "@/lib/i18n-planning-import";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const TAILLE_MAX_ICS = 2_000_000;

function lien(logementId: string, params: Record<string, string> = {}): string {
  return `/hote/planning/import?${new URLSearchParams({
    logement: logementId,
    ...params,
  })}`;
}

function creerSynchroniseur(flux: DrizzleFluxIcsRepository) {
  return new SynchroniserFluxIcs(
    flux,
    creerRecuperateurIcs({ timeoutMs: env.ICS_SYNC_TIMEOUT_MS }),
    new ImporterIcs(new DrizzleImportIcsRepository()),
  );
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);

  if (logements.length === 0) {
    return {
      langue: event.cookies.get("lcd_langue") ?? "fr",
      t: traductionsPlanningImport(event.cookies.get("lcd_langue") ?? "fr"),
      vide: true,
      logements: [],
      logement: null,
      flux: [],
      sync: null,
      fluxOk: null,
      fluxErreur: null,
      fluxLibelle: null,
      fluxUrl: null,
      abonnement: null,
      sante: null,
    };
  }

  const logement =
    logements.find((entree) => entree.id === event.url.searchParams.get("logement")) ??
    logements[0];
  if (!logement) throw new Error("Aucun logement disponible.");

  const repo = new DrizzleFluxIcsRepository();
  const flux = await repo.listerParLogement(tenantId, logement.id);
  const maintenant = new Date();
  const fluxAvecRuns = await Promise.all(
    flux.map(async (entree) => ({
      id: entree.id,
      libelle: entree.libelle,
      url: entree.url,
      actif: entree.actif,
      intervalleMinutes: entree.intervalleMinutes,
      derniereSync: entree.derniereSync
        ? entree.derniereSync.toLocaleString("fr-FR")
        : null,
      derniereTentative: entree.derniereTentative
        ? entree.derniereTentative.toLocaleString("fr-FR")
        : null,
      prochainEssai: entree.prochainEssai
        ? entree.prochainEssai.toLocaleString("fr-FR")
        : "dès que possible",
      dernierStatut: entree.dernierStatut,
      dernierMessage: entree.dernierMessage,
      echecsConsecutifs: entree.echecsConsecutifs,
      enRetard: fluxEnRetard(entree, maintenant),
      runs: (await repo.listerRuns(tenantId, entree.id, 5)).map((run) => ({
        id: run.id,
        debut: run.debut.toLocaleString("fr-FR"),
        statut: run.statut,
        statutHttp: run.statutHttp,
        dureeMs: run.dureeMs,
        crees: run.crees,
        misAJour: run.misAJour,
        annules: run.annules,
        conflits: run.conflits,
        message: run.message,
      })),
    })),
  );

  const token = creerTokenCalendrier({
    tenantId,
    logementId: logement.id,
  });
  const abonnement = `${event.url.origin}/api/calendrier/${logement.id}?t=${encodeURIComponent(token)}`;

  const actifs = flux.filter((entree) => entree.actif);
  return {
    langue: event.cookies.get("lcd_langue") ?? "fr",
    t: traductionsPlanningImport(event.cookies.get("lcd_langue") ?? "fr"),
    vide: false,
    logements: logements.map((entree) => ({ id: entree.id, nom: entree.nom, code: entree.code })),
    logement: { id: logement.id, nom: logement.nom, code: logement.code },
    flux: fluxAvecRuns,
    sync: event.url.searchParams.get("sync"),
    fluxOk: event.url.searchParams.get("fluxOk"),
    fluxErreur: event.url.searchParams.get("fluxErreur"),
    fluxLibelle: event.url.searchParams.get("libelle"),
    fluxUrl: event.url.searchParams.get("url"),
    abonnement,
    sante: {
      total: actifs.length,
      enErreur: actifs.filter((entree) => entree.dernierStatut === "erreur").length,
      enRetard: actifs.filter((entree) => fluxEnRetard(entree, maintenant)).length,
      jamaisSync: actifs.filter((entree) => entree.derniereSync === null).length,
    },
  };
};

export const actions = {
  importer: async (event) => {
    const t = traductionsPlanningImport(event.cookies.get("lcd_langue") ?? "fr");
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const logement = logementId
      ? await new DrizzleLogementRepository().trouverParId(tenantId, logementId)
      : null;
    if (!logement) {
      return fail(400, {
        ok: false,
        message: t.msgLogementIntrouvable,
        resultat: null,
      });
    }
    const fichier = donnees.get("fichier");
    const texteColle = String(donnees.get("ics") ?? "").trim();

    let ics = texteColle;
    if (fichier && typeof fichier !== "string" && fichier.size > 0) {
      if (fichier.size > TAILLE_MAX_ICS) {
        return fail(400, {
          ok: false,
          message: t.msgFichierTropGrand,
          resultat: null,
        });
      }
      ics = await fichier.text();
    }

    if (!ics.trim()) {
      return fail(400, {
        ok: false,
        message: t.msgIcsVide,
        resultat: null,
      });
    }

    try {
      const resultat: ResultatImportIcs = await new ImporterIcs(
        new DrizzleImportIcsRepository(),
      ).executer({
        tenantId,
        logementId,
        fluxIcsId: null,
        ics,
        supprimerAbsents: false,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "planning.import_ics",
          cible: logementId,
          ref: `import-${resultat.total}`,
          payload: {
            total: resultat.total,
            crees: resultat.crees,
            blocages: resultat.blocages,
            misAJour: resultat.misAJour,
            deja: resultat.deja,
            conflits: resultat.conflits,
            ignores: resultat.ignores,
          },
        }),
      );

      const morceaux = [
        t.morceauReservations(resultat.crees),
        t.morceauBlocages(resultat.blocages),
      ];
      if (resultat.misAJour > 0) morceaux.push(t.morceauMaj(resultat.misAJour));
      morceaux.push(
        t.morceauDeja(resultat.deja),
        t.morceauConflits(resultat.conflits),
      );

      return {
        ok: true,
        message: t.msgImportTermine(morceaux.join(", ")),
        resultat,
        logementId,
      };
    } catch (erreur) {
      if (erreur instanceof ErreurMetier) {
        return fail(400, { ok: false, message: erreur.message, resultat: null });
      }
      logErreur("planning.import_ics", erreur, { tenantId, logementId });
      return fail(500, {
        ok: false,
        message: t.msgErreurImport,
        resultat: null,
      });
    }
  },

  enregistrerFlux: async (event) => {
    const t = traductionsPlanningImport(event.cookies.get("lcd_langue") ?? "fr");
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const libelle = String(donnees.get("libelle") ?? "");
    const url = String(donnees.get("url") ?? "");

    const logement = logementId
      ? await new DrizzleLogementRepository().trouverParId(tenantId, logementId)
      : null;
    if (!logement) {
      return fail(400, {
        ok: false,
        message: t.msgLogementIntrouvable,
        resultat: null,
        libelle,
        url,
      });
    }

    try {
      const flux = await new EnregistrerFluxIcs(
        new DrizzleFluxIcsRepository(),
      ).executer({
        tenantId,
        logementId,
        libelle,
        url,
        intervalleMinutes: env.ICS_SYNC_INTERVAL_MINUTES,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "planning.flux_ics.enregistrer",
          cible: flux.id,
          ref: flux.libelle,
          payload: { logementId, intervalleMinutes: flux.intervalleMinutes },
        }),
      );

      return redirect(
        303,
        `/hote/planning/import?logement=${encodeURIComponent(logementId)}&fluxOk=${encodeURIComponent(flux.libelle)}`,
      );
    } catch (erreur) {
      if (isRedirect(erreur)) throw erreur;
      if (erreur instanceof ErreurMetier) {
        return redirect(
          303,
          `/hote/planning/import?logement=${encodeURIComponent(logementId)}&fluxErreur=${encodeURIComponent(erreur.message)}&libelle=${encodeURIComponent(libelle)}&url=${encodeURIComponent(url)}`,
        );
      }
      logErreur("planning.flux_ics.enregistrer", erreur, { tenantId, logementId });
      return redirect(
        303,
        `/hote/planning/import?logement=${encodeURIComponent(logementId)}&fluxErreur=${encodeURIComponent(t.msgErreurInattendue)}&libelle=${encodeURIComponent(libelle)}&url=${encodeURIComponent(url)}`,
      );
    }
  },

  synchroniser: async (event) => {
    const t = traductionsPlanningImport(event.cookies.get("lcd_langue") ?? "fr");
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const fluxId = String(donnees.get("fluxId") ?? "");

    try {
      const flux = new DrizzleFluxIcsRepository();
      const existant = await flux.trouverParId(tenantId, fluxId);
      if (!existant || existant.logementId !== logementId) {
        return fail(400, {
          ok: false,
          message: t.msgFluxIntrouvable,
          resultat: null,
        });
      }
      const resultat = await creerSynchroniseur(flux).executer({
        tenantId,
        fluxId,
        force: true,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "planning.flux_ics.synchroniser",
          cible: fluxId,
          ref: logementId,
          payload: {
            crees: resultat.crees,
            misAJour: resultat.misAJour,
            annules: resultat.annules,
            blocages: resultat.blocages,
            conflits: resultat.conflits,
          },
        }),
      );

      redirect(303, lien(logementId, { sync: resultat.message }));
    } catch (erreur) {
      if (isRedirect(erreur)) throw erreur;
      if (erreur instanceof ErreurMetier) {
        redirect(303, lien(logementId, { sync: erreur.message }));
      }
      logErreur("planning.flux_ics.synchroniser", erreur, { tenantId, fluxId });
      redirect(303, lien(logementId, { sync: "erreur" }));
    }
  },

  synchroniserTout: async (event) => {
    const t = traductionsPlanningImport(event.cookies.get("lcd_langue") ?? "fr");
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const logement = logementId
      ? await new DrizzleLogementRepository().trouverParId(tenantId, logementId)
      : null;
    if (!logement) {
      return fail(400, {
        ok: false,
        message: t.msgLogementIntrouvable,
        resultat: null,
      });
    }
    const flux = new DrizzleFluxIcsRepository();
    const liste = await flux.listerParLogement(tenantId, logementId);
    const synchroniseur = creerSynchroniseur(flux);
    let reussis = 0;
    let erreurs = 0;
    let conflits = 0;

    for (const entree of liste) {
      try {
        const resultat = await synchroniseur.executer({
          tenantId,
          fluxId: entree.id,
          force: true,
        });
        reussis += 1;
        conflits += resultat.conflits;
      } catch {
        erreurs += 1;
      }
    }

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "planning.flux_ics.synchroniser_tout",
        cible: logementId,
        ref: `${liste.length}`,
        payload: { reussis, erreurs, conflits },
      }),
    );

    return {
      ok: erreurs === 0,
      message: t.msgSyncTout(reussis, erreurs, conflits),
      resultat: null,
    };
  },

  supprimerFlux: async (event) => {
    const t = traductionsPlanningImport(event.cookies.get("lcd_langue") ?? "fr");
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const fluxId = String(donnees.get("fluxId") ?? "");

    const repo = new DrizzleFluxIcsRepository();
    const existant = await repo.trouverParId(tenantId, fluxId);
    if (!existant || existant.logementId !== logementId) {
      return fail(400, {
        ok: false,
        message: t.msgFluxIntrouvable,
        resultat: null,
      });
    }

    await repo.supprimer(tenantId, fluxId);
    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "planning.flux_ics.supprimer",
        cible: fluxId,
        ref: logementId,
        payload: {},
      }),
    );

    redirect(303, lien(logementId, { sync: "supprime" }));
  },
} satisfies Actions;
