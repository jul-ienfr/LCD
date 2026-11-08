import { error } from "@sveltejs/kit";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { creerTokenCalendrier } from "@/lib/calendrier-token";
import { traductionsDetails } from "@/lib/i18n-details";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logement = await new DrizzleLogementRepository().trouverParId(
    tenantId,
    event.params.id,
  );
  if (!logement) error(404, "Logement introuvable");

  const token = creerTokenCalendrier({
    tenantId,
    logementId: logement.id,
  });

  return {
    t: traductionsDetails(event.cookies.get("lcd_langue") ?? "fr"),
    logement: { id: logement.id, nom: logement.nom, code: logement.code },
    url: `/api/calendrier/${logement.id}?t=${encodeURIComponent(token)}`,
  };
};
