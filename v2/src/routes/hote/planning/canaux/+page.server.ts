import { fail } from "@sveltejs/kit";
import { CreerCanal } from "@/application/use-cases/creer-canal";
import { EnregistrerFluxIcs } from "@/application/use-cases/enregistrer-flux-ics";
import { ImporterIcs } from "@/application/use-cases/importer-ics";
import { ModifierCanal } from "@/application/use-cases/modifier-canal";
import { SupprimerCanal } from "@/application/use-cases/supprimer-canal";
import { SynchroniserFluxIcs } from "@/application/use-cases/synchroniser-flux-ics";
import { CATALOGUE_CANAUX, ficheCanal } from "@/domain/canal";
import { ficheFournisseur, libelleMode } from "@/domain/fournisseur";
import { ErreurMetier } from "@/domain/erreurs";
import { fluxEnRetard } from "@/domain/flux-ics";
import { creerRecuperateurIcs } from "@/infrastructure/adapters/recuperateur-ics";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleCanalRepository } from "@/infrastructure/db/repositories/canal-repository";
import { DrizzleFluxIcsRepository } from "@/infrastructure/db/repositories/flux-ics-repository";
import { DrizzleFournisseurRepository } from "@/infrastructure/db/repositories/fournisseur-repository";
import { DrizzleImportIcsRepository } from "@/infrastructure/db/repositories/import-ics-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { creerTokenCalendrier } from "@/lib/calendrier-token";
import { env } from "@/lib/env";
import { traductionsCanaux } from "@/lib/i18n-canaux";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function creerSynchroniseur(flux: DrizzleFluxIcsRepository) {
  return new SynchroniserFluxIcs(
    flux,
    creerRecuperateurIcs({ timeoutMs: env.ICS_SYNC_TIMEOUT_MS }),
    new ImporterIcs(new DrizzleImportIcsRepository()),
  );
}

function erreurAction(
  contexte: string,
  erreur: unknown,
  tenantId: string,
  logementId: string,
) {
  if (erreur instanceof ErreurMetier) {
    return fail(400, { ok: false, message: erreur.message });
  }
  logErreur(contexte, erreur, { tenantId, logementId });
  return fail(500, {
    ok: false,
    message: "Erreur inattendue pendant l’opération.",
  });
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const langue = event.cookies.get("lcd_langue") ?? "fr";
  const t = traductionsCanaux(langue);
  const locale = langue === "fr" ? "fr-FR" : langue;
  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);

  if (logements.length === 0) {
    return {
      t,
      vide: true,
      logements: [],
      logement: null,
      canaux: [],
      catalogue: CATALOGUE_CANAUX,
      sante: null,
      fournisseur: null,
    };
  }

  const logement =
    logements.find((entree) => entree.id === event.url.searchParams.get("logement")) ??
    logements[0];
  if (!logement) throw new Error("Aucun logement disponible.");

  const canalRepo = new DrizzleCanalRepository();
  const fluxRepo = new DrizzleFluxIcsRepository();
  const [canaux, flux, affectation] = await Promise.all([
    canalRepo.lister(tenantId, logement.id),
    fluxRepo.listerParLogement(tenantId, logement.id),
    new DrizzleFournisseurRepository().trouverAffectation(
      tenantId,
      logement.id,
    ),
  ]);
  const ficheFournisseurActif = affectation
    ? ficheFournisseur(affectation.fournisseurCode)
    : null;
  const fournisseur = ficheFournisseurActif
    ? {
        code: ficheFournisseurActif.code,
        nom: ficheFournisseurActif.nom,
        mode: ficheFournisseurActif.mode,
        modeLibelle: libelleMode(ficheFournisseurActif.mode),
        externalPropertyId: affectation?.externalPropertyId ?? null,
        derniereSync: affectation?.derniereSync
          ? affectation.derniereSync.toLocaleString("fr-FR")
          : null,
        dernierStatut: affectation?.dernierStatut ?? null,
        dernierMessage: affectation?.dernierMessage ?? null,
      }
    : null;
  const fluxParCanal = new Map(
    flux
      .filter((entree) => entree.canalId !== null)
      .map((entree) => [entree.canalId as string, entree]),
  );
  const maintenant = new Date();

  const canauxVue = canaux.map((canal) => {
    const fiche = ficheCanal(canal.code);
    const fluxCanal = fluxParCanal.get(canal.id) ?? null;
    const token = creerTokenCalendrier({
      tenantId,
      logementId: logement.id,
      canalId: canal.id,
    });
    return {
      id: canal.id,
      code: canal.code,
      libelle: canal.libelle,
      externalListingId: canal.externalListingId,
      actif: canal.actif,
      exportActif: canal.exportActif,
      bufferJours: canal.bufferJours,
      notes: canal.notes,
      nomCatalogue: fiche?.nom ?? canal.code,
      api: fiche?.api ?? "non",
      aVerifier: fiche?.aVerifier ?? false,
      description: fiche?.description ?? "",
      flux: fluxCanal
        ? {
            id: fluxCanal.id,
            url: fluxCanal.url,
            actif: fluxCanal.actif,
            dernierStatut: fluxCanal.dernierStatut,
            dernierMessage: fluxCanal.dernierMessage,
            derniereSync: fluxCanal.derniereSync
              ? fluxCanal.derniereSync.toLocaleString(locale)
              : null,
            prochainEssai: fluxCanal.prochainEssai
              ? fluxCanal.prochainEssai.toLocaleString(locale)
              : t.desQuePossible,
            echecsConsecutifs: fluxCanal.echecsConsecutifs,
            intervalleMinutes: fluxCanal.intervalleMinutes,
            enRetard: fluxEnRetard(fluxCanal, maintenant),
          }
        : null,
      abonnement: `${event.url.origin}/api/calendrier/${logement.id}?t=${encodeURIComponent(token)}`,
    };
  });

  const imports = canauxVue.filter((canal) => canal.flux !== null);
  return {
    t,
    vide: false,
    logements: logements.map((entree) => ({
      id: entree.id,
      nom: entree.nom,
      code: entree.code,
    })),
    logement: { id: logement.id, nom: logement.nom, code: logement.code },
    canaux: canauxVue,
    catalogue: CATALOGUE_CANAUX,
    fournisseur,
    sante: {
      total: canauxVue.length,
      exportsActifs: canauxVue.filter(
        (canal) => canal.actif && canal.exportActif,
      ).length,
      imports: imports.length,
      sansImport: canauxVue.length - imports.length,
      enErreur: imports.filter(
        (canal) => canal.flux?.dernierStatut === "erreur",
      ).length,
      enRetard: imports.filter((canal) => canal.flux?.enRetard).length,
    },
  };
};

export const actions = {
  creer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const logement = logementId
      ? await new DrizzleLogementRepository().trouverParId(tenantId, logementId)
      : null;
    if (!logement) {
      return fail(400, { ok: false, message: "Logement introuvable." });
    }

    try {
      const canal = await new CreerCanal(
        new DrizzleCanalRepository(),
      ).executer({
        tenantId,
        logementId,
        code: String(donnees.get("code") ?? ""),
        libelle: String(donnees.get("libelle") ?? ""),
        externalListingId: String(donnees.get("externalListingId") ?? ""),
        bufferJours: Number(donnees.get("bufferJours") ?? 0),
        exportActif: donnees.get("exportActif") === "on",
        notes: String(donnees.get("notes") ?? ""),
        url: String(donnees.get("url") ?? ""),
        intervalleMinutes: Number(
          donnees.get("intervalleMinutes") ?? env.ICS_SYNC_INTERVAL_MINUTES,
        ),
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "canal.creer",
          cible: canal.id,
          ref: canal.code,
          payload: {
            logementId,
            libelle: canal.libelle,
            bufferJours: canal.bufferJours,
            avecFlux: Boolean(donnees.get("url")),
          },
        }),
      );

      return {
        ok: true,
        message: `Canal « ${canal.libelle} » ajouté.`,
      };
    } catch (erreur) {
      return erreurAction("planning.canaux.creer", erreur, tenantId, logementId);
    }
  },

  modifier: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const canalId = String(donnees.get("canalId") ?? "");
    const repo = new DrizzleCanalRepository();
    const canal = canalId
      ? await repo.trouverParId(tenantId, canalId)
      : null;
    if (!canal || canal.logementId !== logementId) {
      return fail(400, { ok: false, message: "Canal introuvable." });
    }

    try {
      const modifie = await new ModifierCanal(repo).executer({
        tenantId,
        canalId,
        libelle: String(donnees.get("libelle") ?? ""),
        externalListingId: String(donnees.get("externalListingId") ?? ""),
        actif: donnees.get("actif") === "on",
        exportActif: donnees.get("exportActif") === "on",
        bufferJours: Number(donnees.get("bufferJours") ?? 0),
        notes: String(donnees.get("notes") ?? ""),
      });

      const url = String(donnees.get("url") ?? "").trim();
      if (url) {
        await new EnregistrerFluxIcs(
          new DrizzleFluxIcsRepository(),
        ).executer({
          tenantId,
          logementId,
          canalId,
          libelle: modifie.libelle.slice(0, 60),
          url,
          intervalleMinutes: Number(
            donnees.get("intervalleMinutes") ??
              env.ICS_SYNC_INTERVAL_MINUTES,
          ),
        });
      }

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "canal.modifier",
          cible: canalId,
          ref: modifie.code,
          payload: {
            logementId,
            libelle: modifie.libelle,
            actif: modifie.actif,
            exportActif: modifie.exportActif,
            bufferJours: modifie.bufferJours,
            urlModifiee: Boolean(url),
          },
        }),
      );

      return {
        ok: true,
        message: `Canal « ${modifie.libelle} » enregistré.`,
      };
    } catch (erreur) {
      return erreurAction(
        "planning.canaux.modifier",
        erreur,
        tenantId,
        logementId,
      );
    }
  },

  supprimer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const canalId = String(donnees.get("canalId") ?? "");
    const repo = new DrizzleCanalRepository();
    const canal = canalId ? await repo.trouverParId(tenantId, canalId) : null;
    if (!canal || canal.logementId !== logementId) {
      return fail(400, { ok: false, message: "Canal introuvable." });
    }

    try {
      await new SupprimerCanal(repo).executer(tenantId, canalId);
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "canal.supprimer",
          cible: canalId,
          ref: canal.code,
          payload: { logementId, libelle: canal.libelle },
        }),
      );
      return { ok: true, message: `Canal « ${canal.libelle} » supprimé.` };
    } catch (erreur) {
      return erreurAction(
        "planning.canaux.supprimer",
        erreur,
        tenantId,
        logementId,
      );
    }
  },

  synchroniser: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const canalId = String(donnees.get("canalId") ?? "");
    const canal = canalId
      ? await new DrizzleCanalRepository().trouverParId(tenantId, canalId)
      : null;
    if (!canal || canal.logementId !== logementId) {
      return fail(400, { ok: false, message: "Canal introuvable." });
    }

    const flux = (await new DrizzleFluxIcsRepository().listerParLogement(
      tenantId,
      logementId,
    )).find((entree) => entree.canalId === canalId);
    if (!flux) {
      return fail(400, {
        ok: false,
        message: "Ce canal n’a pas de flux iCal à synchroniser.",
      });
    }

    try {
      const resultat = await creerSynchroniseur(
        new DrizzleFluxIcsRepository(),
      ).executer({ tenantId, fluxId: flux.id, force: true });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "flux_ics.sync",
          cible: flux.id,
          ref: canal.code,
          payload: {
            canalId,
            nonModifie: resultat.nonModifie,
            crees: resultat.crees,
            misAJour: resultat.misAJour,
            conflits: resultat.conflits,
          },
        }),
      );

      return {
        ok: true,
        message: resultat.message || "Synchronisation terminée.",
      };
    } catch (erreur) {
      return erreurAction(
        "planning.canaux.synchroniser",
        erreur,
        tenantId,
        logementId,
      );
    }
  },

  supprimerFlux: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const canalId = String(donnees.get("canalId") ?? "");
    const canal = canalId
      ? await new DrizzleCanalRepository().trouverParId(tenantId, canalId)
      : null;
    if (!canal || canal.logementId !== logementId) {
      return fail(400, { ok: false, message: "Canal introuvable." });
    }

    const flux = (await new DrizzleFluxIcsRepository().listerParLogement(
      tenantId,
      logementId,
    )).find((entree) => entree.canalId === canalId);
    if (!flux) {
      return fail(400, {
        ok: false,
        message: "Ce canal n’a pas de flux iCal à retirer.",
      });
    }

    try {
      await new DrizzleFluxIcsRepository().supprimer(tenantId, flux.id);
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "flux_ics.supprimer",
          cible: flux.id,
          ref: canal.code,
          payload: { canalId, logementId },
        }),
      );
      return {
        ok: true,
        message: "Flux iCal retiré. Le canal reste configuré en export.",
      };
    } catch (erreur) {
      return erreurAction(
        "planning.canaux.supprimer_flux",
        erreur,
        tenantId,
        logementId,
      );
    }
  },
} satisfies Actions;
