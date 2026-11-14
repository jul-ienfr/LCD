import { DrizzleEcheancesPaiementRepository } from "@/infrastructure/db/repositories/echeances-paiement-repository";
import { DrizzleFilsVoyageurRepository } from "@/infrastructure/db/repositories/fils-voyageur-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { traductionsFils } from "@/lib/i18n-fils";
import { jourParis } from "@/lib/date-paris";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

export interface Notification {
  type: "message" | "brouillon" | "reservation" | "paiement";
  libelle: string;
  detail: string;
  href: string;
  date: string | null;
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote", "operateur"]);
  const tenantId = tenantIdDeSession(session);
  const langue = event.cookies.get("lcd_langue") ?? "fr";
  const notifications: Notification[] = [];

  const fils = new DrizzleFilsVoyageurRepository();
  for (const fil of await fils.listerParTenant(tenantId, { statut: "ouvert" })) {
    const messages = await fils.listerMessages(tenantId, fil.id);
    const nonLus = messages.filter((m) => m.sens === "entrant" && !m.luAt).length;
    const brouillons = messages.filter((m) => m.statut === "brouillon").length;
    if (nonLus > 0) {
      notifications.push({
        type: "message",
        libelle: `${nonLus} message(s) non lu(s) — ${fil.voyageurNom}`,
        detail: messages.at(-1)?.contenu.slice(0, 140) ?? "",
        href: `/hote/messages/fils/${fil.id}`,
        date: messages.at(-1)?.createdAt.toISOString() ?? null,
      });
    }
    if (brouillons > 0) {
      notifications.push({
        type: "brouillon",
        libelle: `${brouillons} brouillon(s) à valider — ${fil.voyageurNom}`,
        detail: "Aucun message automatique ne part sans validation.",
        href: `/hote/messages/fils/${fil.id}`,
        date: fil.dernierMessageAt?.toISOString() ?? null,
      });
    }
  }

  for (const reservation of await new DrizzleReservationRepository().listerTous(
    tenantId,
  )) {
    if (reservation.statut === "brouillon") {
      notifications.push({
        type: "reservation",
        libelle: `Réservation à confirmer — ${reservation.ref}`,
        detail: `${reservation.clientNom ?? "Voyageur"} · du ${reservation.debut} au ${reservation.fin}`,
        href: "/hote/planning",
        date: reservation.debut,
      });
    }
  }

  const retard = await new DrizzleEcheancesPaiementRepository().listerEnRetard(
    tenantId,
    jourParis(),
  );
  for (const echeance of retard.slice(0, 50)) {
    notifications.push({
      type: "paiement",
      libelle: `Paiement en retard — ${echeance.type}`,
      detail: `${(echeance.montantCentimes / 100).toFixed(2)} € exigible le ${echeance.exigibleLe}`,
      href: "/hote/compta",
      date: echeance.exigibleLe,
    });
  }

  const parType = {
    message: notifications.filter((n) => n.type === "message").length,
    brouillon: notifications.filter((n) => n.type === "brouillon").length,
    reservation: notifications.filter((n) => n.type === "reservation").length,
    paiement: notifications.filter((n) => n.type === "paiement").length,
  };

  return {
    t: traductionsFils(langue),
    langue,
    notifications,
    parType,
    total: notifications.length,
  };
};
