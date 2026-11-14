/**
 * US7 (T711) — Page d'intégration Nuki.
 *
 * L'adapter Nuki existe depuis US6 (`infrastructure/adapters/serrures/nuki.ts`).
 * Cette page ne saisit aucun secret : le token reste dans `NUKI_API_TOKEN`.
 * Elle indique si la serrure est configurée, active l'intégration pour le
 * tenant et renvoie vers les codes d'accès de chaque logement.
 */
import { redirect } from "@sveltejs/kit";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleIntegrationsRepository } from "@/infrastructure/db/repositories/integrations-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { creerSerrureNuki } from "@/infrastructure/adapters/serrures/nuki";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const [integration, logements] = await Promise.all([
    new DrizzleIntegrationsRepository().trouver(tenantId, "nuki"),
    new DrizzleLogementRepository().listerParTenant(tenantId),
  ]);

  return {
    configuree: creerSerrureNuki().estDisponible(),
    active: integration?.actif ?? false,
    majLe: integration?.majLe.slice(0, 16).replace("T", " ") ?? null,
    logements: logements
      .filter((logement) => logement.statut === "actif")
      .map((logement) => ({
        id: logement.id,
        nom: logement.nom,
        code: logement.code,
      })),
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  basculer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const actif = texte(donnees, "actif") === "true";

    try {
      await new DrizzleIntegrationsRepository().enregistrer(
        tenantId,
        "nuki",
        { actif, config: {} },
      );
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: actif
            ? "integration.nuki_activer"
            : "integration.nuki_desactiver",
          cible: "nuki",
          ref: "nuki",
          payload: { actif },
        }),
      );
    } catch (error) {
      logErreur("integrations.nuki", error, { tenantId, actif });
      redirect(303, "/hote/integrations/nuki?erreur=inattendu");
    }

    redirect(303, `/hote/integrations/nuki?ok=${actif ? "activee" : "desactivee"}`);
  },
} satisfies Actions;
