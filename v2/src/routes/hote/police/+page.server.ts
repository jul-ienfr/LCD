import { DrizzleFichesPoliceRepository } from "@/infrastructure/db/repositories/fiches-police-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { traductionsConformite } from "@/lib/i18n-conformite";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const [fiches, logements, reservations] = await Promise.all([
    new DrizzleFichesPoliceRepository().lister(tenantId, 200),
    new DrizzleLogementRepository().listerParTenant(tenantId),
    new DrizzleReservationRepository().listerTous(tenantId),
  ]);

  const nomLogement = new Map(logements.map((logement) => [logement.id, logement.nom]));
  const refSejour = new Map(reservations.map((reservation) => [reservation.id, reservation.ref]));

  return {
    t: traductionsConformite(event.cookies.get("lcd_langue") ?? "fr"),
    fiches: fiches.map((fiche) => ({
      id: fiche.id,
      sejour: refSejour.get(fiche.reservationId) ?? "—",
      logement: nomLogement.get(fiche.logementId) ?? "—",
      personne: `${fiche.prenoms} ${fiche.nom}`,
      nationalite: fiche.nationalite,
      naissance: fiche.dateNaissance,
      lieuNaissance: fiche.lieuNaissance,
      telephone: fiche.telephone,
      domicile: fiche.domicile,
      recue: fiche.createdAt.toISOString().slice(0, 10),
      purge: fiche.purgeAt.toISOString().slice(0, 10),
    })),
  };
};
