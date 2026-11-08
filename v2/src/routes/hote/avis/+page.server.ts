import { isRedirect, redirect } from "@sveltejs/kit";
import { moyenneAvis } from "@/domain/avis";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleAvisRepository } from "@/infrastructure/db/repositories/avis-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const avis = await new DrizzleAvisRepository().listerParTenant(tenantId);
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const noms = new Map(logements.map((logement) => [logement.id, logement.nom]));
  const publies = avis.filter((entree) => entree.statut === "publie");

  return {
    langue: event.cookies.get("lcd_langue") ?? "fr",
    avis: avis.map((entree) => ({
      id: entree.id,
      nom: entree.nom,
      logement: noms.get(entree.logementId) ?? "Logement",
      note: entree.note,
      commentaire: entree.commentaire,
      statut: entree.statut,
      date: new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
      }).format(entree.createdAt),
    })),
    total: avis.length,
    publies: publies.length,
    moyenne: moyenneAvis(publies.map((entree) => entree.note)),
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  moderer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "id");
    const statut = texte(donnees, "statut");

    if (statut !== "publie" && statut !== "masque") {
      redirect(303, "/hote/avis?erreur=statut");
    }

    try {
      const avis = await new DrizzleAvisRepository().changerStatut(
        tenantId,
        id,
        statut,
      );
      if (!avis) redirect(303, "/hote/avis?erreur=introuvable");

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "avis.moderation",
          cible: avis.id,
          ref: `avis-mod-${crypto.randomUUID()}`,
          payload: { statut },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("avis.moderer", error, { tenantId, cible: id });
      redirect(303, "/hote/avis?erreur=inattendu");
    }

    redirect(303, "/hote/avis?ok=1");
  },
} satisfies Actions;
