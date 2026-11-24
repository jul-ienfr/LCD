import { fail, redirect } from "@sveltejs/kit";
import { ErreurMetier } from "@/domain/erreurs";
import { AUTOMATISATIONS_PAR_DEFAUT } from "@/domain/automatisations-defaut";
import {
  DECLENCHEURS,
  LIBELLES_DECLENCHEUR,
  codeAutomatisationValide,
  declencheurValide,
  normaliserCodeAutomatisation,
  validerAutomatisation,
  type DeclencheurAutomatisation,
} from "@/domain/automatisation-message";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleAutomatisationsRepository } from "@/infrastructure/db/repositories/automatisations-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { traductionsFils } from "@/lib/i18n-fils";
import { logErreur } from "@/lib/logger";
import { exigerConfirmation } from "@/lib/server/confirmation";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";
import { langueRequete } from "@/lib/server/langue";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

const OK: Record<string, string> = {
  cree: "okCree",
  modifie: "okModifie",
  supprime: "okSupprime",
};

function defautParCode(code: string) {
  return AUTOMATISATIONS_PAR_DEFAUT.find((defaut) => defaut.code === code) ?? null;
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const langue = langueRequete(event);
  const automatisations = await new DrizzleAutomatisationsRepository().listerParTenant(
    tenantId,
  );
  const codes = new Set(automatisations.map((a) => a.code));

  return {
    t: traductionsFils(langue),
    langue,
    automatisations: automatisations.map((a) => ({
      ...a,
      declencheurLibelle: LIBELLES_DECLENCHEUR[a.declencheur],
    })),
    defauts: AUTOMATISATIONS_PAR_DEFAUT.map((defaut) => ({
      code: defaut.code,
      libelle: defaut.libelle,
      declencheur: defaut.declencheur,
      declencheurLibelle: LIBELLES_DECLENCHEUR[defaut.declencheur],
      dejaCree: codes.has(defaut.code),
    })),
    declencheurs: DECLENCHEURS.map((declencheur) => ({
      valeur: declencheur,
      libelle: LIBELLES_DECLENCHEUR[declencheur],
    })),
    ok: OK[event.url.searchParams.get("ok") ?? ""] ?? null,
    erreur: event.url.searchParams.get("erreur") ?? null,
  };
};

async function tracer(
  tenantId: string,
  qui: string,
  action: string,
  cible: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await withTenant(tenantId, (tx) =>
    tx.insert(auditLogs).values({ tenantId, qui, action, cible, payload }),
  );
}

export const actions: Actions = {
  creer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const codeBrut = texte(donnees, "code");
    const defaut = defautParCode(codeBrut);
    const code = normaliserCodeAutomatisation(codeBrut);
    if (!codeAutomatisationValide(code)) {
      return fail(400, { erreur: "Code d'automatisation invalide." });
    }
    const declencheur = texte(donnees, "declencheur") || defaut?.declencheur || "j-1";
    if (!declencheurValide(declencheur)) {
      return fail(400, { erreur: "Déclencheur inconnu." });
    }
    const libelle = texte(donnees, "libelle") || defaut?.libelle || code;
    const modele = texte(donnees, "modele") || defaut?.modele || "";
    const sujet = texte(donnees, "sujet") || defaut?.sujet || "Votre séjour";

    try {
      validerAutomatisation({
        code,
        libelle,
        declencheur: declencheur as DeclencheurAutomatisation,
        canal: defaut?.canal ?? "email",
        modele,
        sujet,
      });
    } catch (erreur) {
      if (erreur instanceof ErreurMetier) {
        return fail(400, { erreur: erreur.message });
      }
      throw erreur;
    }

    const depot = new DrizzleAutomatisationsRepository();
    const existante = await depot.trouverParCode(tenantId, code);
    if (existante) {
      return fail(400, { erreur: "Cette automatisation existe déjà." });
    }

    const automatisation = await depot.creer({
      tenantId,
      code,
      libelle,
      declencheur: declencheur as DeclencheurAutomatisation,
      canal: defaut?.canal ?? "email",
      modele,
      sujet,
      actif: true,
      conditions: defaut?.conditions ?? {},
    });
    await tracer(tenantId, session.user?.email ?? "inconnu", "automatisation.creer", automatisation.id, {
      code,
      declencheur,
    });
    redirect(303, "/hote/automatisations?ok=cree");
  },

  modifier: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "id");
    const libelle = texte(donnees, "libelle");
    const modele = texte(donnees, "modele");
    const sujet = texte(donnees, "sujet");
    const depot = new DrizzleAutomatisationsRepository();
    const existante = await depot.trouverParId(tenantId, id);
    if (!existante) {
      return fail(404, { erreur: "Automatisation introuvable." });
    }

    try {
      validerAutomatisation({
        code: existante.code,
        libelle: libelle || existante.libelle,
        declencheur: existante.declencheur,
        canal: existante.canal,
        modele: modele || existante.modele,
        sujet: sujet || existante.sujet,
      });
    } catch (erreur) {
      if (erreur instanceof ErreurMetier) {
        return fail(400, { erreur: erreur.message });
      }
      throw erreur;
    }

    const maj = await depot.modifier(tenantId, id, {
      ...(libelle ? { libelle } : {}),
      ...(modele ? { modele } : {}),
      ...(sujet ? { sujet } : {}),
    });
    if (!maj) return fail(404, { erreur: "Automatisation introuvable." });
    await tracer(tenantId, session.user?.email ?? "inconnu", "automatisation.modifier", id, {
      libelle,
    });
    redirect(303, "/hote/automatisations?ok=modifie");
  },

  basculer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "id");
    const actif = texte(donnees, "actif") === "true";
    const depot = new DrizzleAutomatisationsRepository();
    const maj = await depot.modifier(tenantId, id, { actif });
    if (!maj) return fail(404, { erreur: "Automatisation introuvable." });
    await tracer(tenantId, session.user?.email ?? "inconnu", "automatisation.basculer", id, {
      actif,
    });
    redirect(303, "/hote/automatisations?ok=modifie");
  },

  supprimer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "id");
    // Deux étapes (FR-039) : sans `confirmation`, rien n'est supprimé.
    exigerConfirmation(donnees, {
      action: "supprimer",
      retour: "/hote/automatisations",
      cible: id,
    });
    const depot = new DrizzleAutomatisationsRepository();
    const supprime = await depot.supprimer(tenantId, id);
    if (!supprime) {
      logErreur("automatisation.supprimer", new Error("introuvable"), { id });
      return fail(404, { erreur: "Automatisation introuvable." });
    }
    await tracer(tenantId, session.user?.email ?? "inconnu", "automatisation.supprimer", id, {});
    redirect(303, "/hote/automatisations?ok=supprime");
  },
};
