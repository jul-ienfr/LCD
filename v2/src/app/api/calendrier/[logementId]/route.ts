import { connection } from "next/server";
import { genererCalendrierIcs } from "@/domain/ics-export";
import { DrizzleBlocageRepository } from "@/infrastructure/db/repositories/blocage-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { verifierTokenCalendrier } from "@/lib/calendrier-token";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ logementId: string }> },
) {
  await connection();

  const { logementId } = await params;
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const payload = verifierTokenCalendrier(token);
  if (!payload || payload.logementId !== logementId) {
    return new Response("Lien calendrier invalide ou expiré.", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const logement = await new DrizzleLogementRepository().trouverParId(
    payload.tenantId,
    logementId,
  );
  if (!logement) {
    return new Response("Logement introuvable.", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const [reservations, blocages] = await Promise.all([
    new DrizzleReservationRepository().listerTous(payload.tenantId),
    new DrizzleBlocageRepository().listerTous(payload.tenantId),
  ]);

  const evenements = [
    ...reservations
      .filter(
        (reservation) =>
          reservation.logementId === logementId &&
          reservation.statut !== "annulee",
      )
      .map((reservation) => ({
        uid: `resa-${reservation.id}@lcd-parc`,
        debut: reservation.debut,
        fin: reservation.fin,
        titre: `Réservation ${reservation.ref}`,
        description: reservation.source
          ? `Source : ${reservation.source}`
          : null,
        statut: "CONFIRMED" as const,
      })),
    ...blocages
      .filter((blocage) => blocage.logementId === logementId)
      .map((blocage) => ({
        uid: `blocage-${blocage.id}@lcd-parc`,
        debut: blocage.debut,
        fin: blocage.fin,
        titre: "Indisponible",
        description: blocage.motif
          ? `Motif : ${blocage.motif}`
          : `Réf. ${blocage.ref}`,
        statut: "TENTATIVE" as const,
      })),
  ].sort((a, b) => a.debut.localeCompare(b.debut));

  const ics = genererCalendrierIcs(logement.nom, evenements);
  const nomFichier = `lcd-${logement.code.replace(/[^a-zA-Z0-9_-]/gu, "-")}.ics`;

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${nomFichier}"`,
      "Content-Language": "fr",
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
