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
  const filsOuverts = await fils.listerParTenant(tenantId, { statut: "ouvert" });
  // FR-027 : un seul chargement agrégé au lieu d'un `listerMessages` par fil.
  const resumes = await fils.resumerMessagesParFils(
    tenantId,
    filsOuverts.map((fil) => fil.id),
  );
  for (const fil of filsOuverts) {
    const resume = resumes.get(fil.id);
    if (!resume) continue;
    const dernier = resume.dernier;
    if (resume.nonLus > 0) {
      notifications.push({
        type: "message",
        libelle: `${resume.nonLus} message(s) non lu(s) — ${fil.voyageurNom}`,
        detail: dernier?.contenu.slice(0, 140) ?? "",
        href: `/hote/messages/fils/${fil.id}`,
        date: dernier?.createdAt.toISOString() ?? null,
      });
    }
    if (resume.brouillons > 0) {
      notifications.push({
        type: "brouillon",
        libelle: `${resume.brouillons} brouillon(s) à valider — ${fil.voyageurNom}`,
        detail: "Aucun message automatique ne part sans validation.",
        href: `/hote/messages/fils/${fil.id}`,
        date: fil.dernierMessageAt?.toISOString() ?? null,
      });
    }
  }

  // FR-026 : seul le statut utile est lu, et la requête est bornée côté SQL.
  const brouillons = await new DrizzleReservationRepository().listerPage(
    tenantId,
    {
      statut: "brouillon",
      limite: 100,
      decalage: 0,
      ordre: "debut-desc",
    },
  );
  for (const reservation of brouillons) {
    notifications.push({
      type: "reservation",
      libelle: `Réservation à confirmer — ${reservation.ref}`,
      detail: `${reservation.clientNom ?? "Voyageur"} · du ${reservation.debut} au ${reservation.fin}`,
      href: "/hote/planning",
      date: reservation.debut,
    });
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
