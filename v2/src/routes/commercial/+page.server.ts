import { fail } from "@sveltejs/kit";
import { CreerProspect } from "@/application/use-cases/creer-prospect";
import { ErreurMetier } from "@/domain/erreurs";
import type { StatutProspect } from "@/domain/prospect";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleOffreRepository } from "@/infrastructure/db/repositories/offre-repository";
import { DrizzleProspectRepository } from "@/infrastructure/db/repositories/prospect-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const COLONNES: { statut: StatutProspect; libelle: string }[] = [
  { statut: "nouveau", libelle: "Nouveau" },
  { statut: "qualifie", libelle: "Qualifié" },
  { statut: "visite", libelle: "Visite" },
  { statut: "offre", libelle: "Offre" },
  { statut: "gagne", libelle: "Gagné" },
  { statut: "perdu", libelle: "Perdu" },
];

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["commercial", "admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const prospects = await new DrizzleProspectRepository().lister(tenantId);
  const offres = await new DrizzleOffreRepository().lister(tenantId);

  return {
    prospection: COLONNES.map((colonne) => ({
      ...colonne,
      items: prospects
        .filter((prospect) => prospect.statut === colonne.statut)
        .map((prospect) => ({
          id: prospect.id,
          nom: prospect.nom,
          source: prospect.source,
          email: prospect.email,
        })),
    })),
    nombreProspects: prospects.length,
    enCours: prospects.filter(
      (prospect) => !["gagne", "perdu"].includes(prospect.statut),
    ).length,
    gagnes: prospects.filter((prospect) => prospect.statut === "gagne").length,
    nombreOffres: offres.length,
    estCommercial: session.user.role === "commercial",
  };
};

export const actions = {
  creer: async (event) => {
    const session = requireRole(event, ["commercial", "admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    try {
      const prospect = await new CreerProspect(
        new DrizzleProspectRepository(),
      ).executer({
        tenantId,
        nom: String(donnees.get("nom") ?? ""),
        email: String(donnees.get("email") ?? ""),
        telephone: String(donnees.get("telephone") ?? ""),
        source: String(donnees.get("source") ?? "") || "manuel",
        notes: String(donnees.get("notes") ?? ""),
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "prospect.creer",
          cible: prospect.id,
          ref: prospect.email ?? prospect.nom,
          payload: { statut: prospect.statut, source: prospect.source },
        }),
      );
      return { ok: true, message: `Prospect ${prospect.nom} créé.` };
    } catch (error) {
      if (error instanceof ErreurMetier) return fail(400, { ok: false, message: error.message });
      logErreur("commercial.creer", error, { tenantId });
      return fail(500, { ok: false, message: "Erreur inattendue. Réessayez." });
    }
  },
} satisfies Actions;
