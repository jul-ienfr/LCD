import { fail, isRedirect, redirect } from "@sveltejs/kit";
import { ConfigurerEnGroupe } from "@/application/use-cases/configurer-en-groupe";
import { ErreurMetier } from "@/domain/erreurs";
import {
  LIBELLES_STRATEGIE_PRIX,
  STRATEGIES_PRIX,
} from "@/domain/strategie-prix";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleConfigurationGroupeeRepository } from "@/infrastructure/db/repositories/configuration-groupee-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import {
  traductionsReglagesGroupe,
  type TraductionsReglagesGroupe,
} from "@/lib/i18n-reglages-groupe";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, cle: string): string {
  return String(donnees.get(cle) ?? "").trim();
}

function nombreOuNull(donnees: FormData, cle: string): number | null {
  const valeur = texte(donnees, cle);
  if (!valeur) return null;
  const nombre = Number(valeur.replace(",", "."));
  return Number.isFinite(nombre) ? nombre : Number.NaN;
}

function selection(donnees: FormData): string[] {
  return donnees.getAll("logementIds").map(String).filter(Boolean);
}

function erreurAction(
  error: unknown,
  contexte: string,
  t: TraductionsReglagesGroupe,
) {
  if (error instanceof ErreurMetier) {
    return fail(400, { ok: false, message: error.message, apercu: null });
  }
  logErreur(contexte, error);
  return fail(500, {
    ok: false,
    message: t.erreurInattendue,
    apercu: null,
  });
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin"]);
  const tenantId = tenantIdDeSession(session);
  const repo = new DrizzleConfigurationGroupeeRepository();
  const [logements, versions] = await Promise.all([
    repo.listerLogements(tenantId),
    repo.listerVersions(tenantId, 10),
  ]);

  return {
    langue: event.cookies.get("lcd_langue") ?? "fr",
    email: session.user.email ?? null,
    logements,
    strategies: STRATEGIES_PRIX.map((valeur) => ({
      valeur,
      libelle: LIBELLES_STRATEGIE_PRIX[valeur],
    })),
    versions: versions.map((version) => ({
      id: version.id,
      ref: version.ref,
      action: version.action,
      auteurEmail: version.auteurEmail,
      createdAt: version.createdAt.toISOString(),
      logements: version.lignes.length,
    })),
    ok: event.url.searchParams.get("ok"),
    nombre: event.url.searchParams.get("n"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  previsualiser: async (event) => {
    const session = requireRole(event, ["admin"]);
    const tenantId = tenantIdDeSession(session);
    const t = traductionsReglagesGroupe(
      event.cookies.get("lcd_langue") ?? "fr",
    );
    const donnees = await event.request.formData();
    try {
      const resultat = await new ConfigurerEnGroupe(
        new DrizzleConfigurationGroupeeRepository(),
      ).previsualiser({
        tenantId,
        logementIds: selection(donnees),
        bufferJours: nombreOuNull(donnees, "bufferJours"),
        cutoffJours: nombreOuNull(donnees, "cutoffJours"),
        strategiePrix: texte(donnees, "strategiePrix") || null,
      });
      const modifies = resultat.lignes.filter((ligne) => ligne.modifie).length;
      return {
        ok: true,
        message:
          modifies === 0
            ? t.apercuAucunChangement
            : t.apercuModifies(modifies),
        apercu: resultat.lignes,
      };
    } catch (error) {
      return erreurAction(error, "configuration.previsualiser", t);
    }
  },

  appliquer: async (event) => {
    const session = requireRole(event, ["admin"]);
    const tenantId = tenantIdDeSession(session);
    const t = traductionsReglagesGroupe(
      event.cookies.get("lcd_langue") ?? "fr",
    );
    const donnees = await event.request.formData();
    try {
      const resultat = await new ConfigurerEnGroupe(
        new DrizzleConfigurationGroupeeRepository(),
      ).appliquer({
        tenantId,
        logementIds: selection(donnees),
        bufferJours: nombreOuNull(donnees, "bufferJours"),
        cutoffJours: nombreOuNull(donnees, "cutoffJours"),
        strategiePrix: texte(donnees, "strategiePrix") || null,
        acteurEmail: session.user.email ?? "admin",
      });
      const version = resultat.version;
      if (!version) {
        redirect(303, "/hote/reglages-groupe?ok=aucun");
      }
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "configuration.appliquer",
          cible: version.id,
          ref: version.ref,
          payload: {
            logements: resultat.modifies,
            changement: version.lignes[0]?.apres ?? null,
          },
        }),
      );
      redirect(
        303,
        `/hote/reglages-groupe?ok=applique&n=${resultat.modifies}`,
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      return erreurAction(error, "configuration.appliquer", t);
    }
  },

  restaurer: async (event) => {
    const session = requireRole(event, ["admin"]);
    const tenantId = tenantIdDeSession(session);
    const t = traductionsReglagesGroupe(
      event.cookies.get("lcd_langue") ?? "fr",
    );
    const donnees = await event.request.formData();
    const versionId = texte(donnees, "versionId");
    try {
      const resultat = await new ConfigurerEnGroupe(
        new DrizzleConfigurationGroupeeRepository(),
      ).restaurer({
        tenantId,
        versionId,
        acteurEmail: session.user.email ?? "admin",
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "configuration.restaurer",
          cible: resultat.version.id,
          ref: resultat.version.ref,
          payload: {
            source: versionId,
            logements: resultat.lignes.length,
          },
        }),
      );
      redirect(
        303,
        `/hote/reglages-groupe?ok=restaure&n=${resultat.lignes.length}`,
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      return erreurAction(error, "configuration.restaurer", t);
    }
  },
} satisfies Actions;
