import { redirect } from "@sveltejs/kit";
import { ErreurMetier } from "@/domain/erreurs";
import { appliquerOptout, statutFilValide, type StatutFil } from "@/domain/fil-voyageur";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleFilsVoyageurRepository } from "@/infrastructure/db/repositories/fils-voyageur-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { traductionsFils } from "@/lib/i18n-fils";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import { echecSaisie } from "@/lib/server/saisie";
import type { Actions, PageServerLoad } from "./$types";
import { langueRequete } from "@/lib/server/langue";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

const OK: Record<string, string> = {
  statut: "statutMisAJour",
  optout: "optoutFait",
};

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote", "operateur"]);
  const tenantId = tenantIdDeSession(session);
  const langue = langueRequete(event);

  const statutParam = event.url.searchParams.get("statut") ?? "";
  const logementId = event.url.searchParams.get("logement") ?? "";
  const recherche = event.url.searchParams.get("recherche") ?? "";
  const assigne = event.url.searchParams.get("assigne") ?? "";

  const depot = new DrizzleFilsVoyageurRepository();
  const [fils, logements] = await Promise.all([
    depot.listerParTenant(tenantId, {
      ...(statutFilValide(statutParam) ? { statut: statutParam as StatutFil } : {}),
      ...(logementId ? { logementId } : {}),
      ...(recherche ? { recherche } : {}),
      ...(assigne === "aucun" ? { assigneA: null } : {}),
    }),
    new DrizzleLogementRepository().listerParTenant(tenantId),
  ]);

  const nomsLogements = new Map(logements.map((l) => [l.id, l.nom]));
  // FR-027 : résumé agrégé en une requête au lieu d'un `listerMessages` par fil.
  const resumes = await depot.resumerMessagesParFils(
    tenantId,
    fils.map((fil) => fil.id),
  );
  const lignes = [];
  for (const fil of fils) {
    const resume = resumes.get(fil.id);
    const dernier = resume?.dernier ?? null;
    lignes.push({
      id: fil.id,
      voyageurNom: fil.voyageurNom,
      voyageurEmail: fil.voyageurEmail,
      voyageurTelephone: fil.voyageurTelephone,
      statut: fil.statut,
      assigneA: fil.assigneA,
      logement: fil.logementId ? (nomsLogements.get(fil.logementId) ?? null) : null,
      nombreMessages: resume?.total ?? 0,
      nonLus: resume?.nonLus ?? 0,
      brouillons: resume?.brouillons ?? 0,
      dernierContenu: dernier?.contenu ?? null,
      dernierCanal: dernier?.canal ?? null,
      dernierDate: dernier?.createdAt ?? fil.dernierMessageAt,
    });
  }

  return {
    t: traductionsFils(langue),
    langue,
    lignes,
    logements: logements.map((logement) => ({ id: logement.id, nom: logement.nom })),
    filtres: { statut: statutParam, logement: logementId, recherche, assigne },
    ok: OK[event.url.searchParams.get("ok") ?? ""] ?? null,
    erreur: event.url.searchParams.get("erreur") ?? null,
  };
};

export const actions: Actions = {
  assigner: async (event) => {
    const session = requireRole(event, ["admin", "hote", "operateur"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const filId = texte(donnees, "filId");
    const assigneA = texte(donnees, "assigneA");
    try {
      const fil = await new DrizzleFilsVoyageurRepository().mettreAJour(
        tenantId,
        filId,
        { assigneA: assigneA || null },
      );
      if (!fil) throw new ErreurMetier("MESSAGE_INVALIDE", "Fil introuvable.");
      await withTenant(tenantId, async (tx) => {
        await tx.insert(auditLogs).values({
          tenantId,
          qui: session.user?.email ?? "inconnu",
          action: "fil.assigner",
          cible: filId,
          payload: { assigneA: assigneA || null },
        });
      });
    } catch (erreur) {
      if (erreur instanceof ErreurMetier) {
        logErreur("fils.assigner", erreur, { filId });
        return echecSaisie(donnees, erreur.message);
      }
      throw erreur;
    }
    redirect(303, "/hote/messages/fils?ok=statut");
  },

  statut: async (event) => {
    const session = requireRole(event, ["admin", "hote", "operateur"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const filId = texte(donnees, "filId");
    const statut = texte(donnees, "statut");
    if (!statutFilValide(statut)) {
      return echecSaisie(donnees, "Statut inconnu.");
    }
    const fil = await new DrizzleFilsVoyageurRepository().mettreAJour(tenantId, filId, {
      statut: statut as StatutFil,
    });
    if (!fil) {
      return echecSaisie(donnees, "Fil introuvable.");
    }
    await withTenant(tenantId, async (tx) => {
      await tx.insert(auditLogs).values({
        tenantId,
        qui: session.user?.email ?? "inconnu",
        action: "fil.statut",
        cible: filId,
        payload: { statut },
      });
    });
    redirect(303, "/hote/messages/fils?ok=statut");
  },

  optout: async (event) => {
    const session = requireRole(event, ["admin", "hote", "operateur"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const filId = texte(donnees, "filId");
    const canal = texte(donnees, "canal") === "whatsapp" ? "whatsapp" : "sms";
    const depot = new DrizzleFilsVoyageurRepository();
    const fil = await depot.trouverParId(tenantId, filId);
    if (!fil) {
      return echecSaisie(donnees, "Fil introuvable.");
    }
    await depot.mettreAJour(tenantId, filId, {
      consentements: appliquerOptout(fil.consentements, canal),
    });
    await withTenant(tenantId, async (tx) => {
      await tx.insert(auditLogs).values({
        tenantId,
        qui: session.user?.email ?? "inconnu",
        action: "fil.optout",
        cible: filId,
        payload: { canal },
      });
    });
    redirect(303, "/hote/messages/fils?ok=optout");
  },
};
