import { DrizzleEcheancesPaiementRepository } from "@/infrastructure/db/repositories/echeances-paiement-repository";
import { DrizzleFilsVoyageurRepository } from "@/infrastructure/db/repositories/fils-voyageur-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { traductionsFils } from "@/lib/i18n-fils";
import { bornerPage, nombreDePages } from "@/domain/pagination";
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

  // FR-043 : le centre est paginé côté serveur, du plus récent au plus ancien.
  // Les tailles et bornes viennent de `@/domain/pagination` (FR-026) : une page
  // forgée ne charge jamais tout le tenant.
  const dateDe = (notification: Notification): number => {
    const instant = notification.date ? Date.parse(notification.date) : Number.NaN;
    return Number.isFinite(instant) ? instant : 0;
  };
  notifications.sort(
    (a, b) =>
      dateDe(b) - dateDe(a) ||
      a.libelle.localeCompare(b.libelle, langue),
  );

  const typeFiltreBrut = event.url.searchParams.get("type");
  const typeFiltre =
    typeFiltreBrut === "message" || typeFiltreBrut === "paiement"
      ? typeFiltreBrut
      : null;
  const filtrees = typeFiltre
    ? notifications.filter((n) => n.type === typeFiltre)
    : notifications;

  const taillePage = 20;
  const bornee = bornerPage(event.url.searchParams.get("page"), taillePage);
  const pages = nombreDePages(filtrees.length, bornee.taille);
  const pageCourante = Math.min(bornee.page, pages);
  const debut = (pageCourante - 1) * bornee.taille;
  const affichees = filtrees.slice(debut, debut + bornee.taille);

  const lien = (numero: number) => {
    const params = new URLSearchParams();
    if (typeFiltre) params.set("type", typeFiltre);
    params.set("page", String(numero));
    return `/hote/notifications?${params.toString()}`;
  };

  return {
    t: traductionsFils(langue),
    langue,
    notifications: affichees,
    parType,
    total: filtrees.length,
    totalGlobal: notifications.length,
    typeFiltre,
    pageCourante,
    pages,
    taillePage: bornee.taille,
    lienPrecedent: pageCourante > 1 ? lien(pageCourante - 1) : null,
    lienSuivant: pageCourante < pages ? lien(pageCourante + 1) : null,
  };
};
