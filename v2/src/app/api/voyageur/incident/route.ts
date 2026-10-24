import { connection } from "next/server";
import { ErreurMetier } from "@/domain/erreurs";
import { DeclarerIncident } from "@/application/use-cases/declarer-incident";
import { DrizzleIncidentRepository } from "@/infrastructure/db/repositories/incident-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { logErreur } from "@/lib/logger";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";

export async function POST(request: Request) {
  await connection();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, erreur: "JSON invalide." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ ok: false, erreur: "Corps invalide." }, { status: 400 });
  }

  const { token, ref, message } = body as {
    token?: unknown;
    ref?: unknown;
    message?: unknown;
  };

  const payload = typeof token === "string" ? verifierTokenVoyageur(token) : null;
  if (!payload) {
    return Response.json(
      { ok: false, erreur: "Lien voyageur invalide ou expiré." },
      { status: 401 },
    );
  }

  try {
    const resultat = await new DeclarerIncident(
      new DrizzleIncidentRepository(),
      new DrizzleReservationRepository(),
    ).executer({
      tenantId: payload.tenantId,
      logementId: payload.logementId,
      reservationId: payload.reservationId,
      ref: String(ref ?? ""),
      message: String(message ?? ""),
    });

    return Response.json(
      {
        ok: true,
        idempotent: !resultat.cree,
        incident: {
          id: resultat.incident.id,
          ref: resultat.incident.ref,
          statut: resultat.incident.statut,
          createdAt: resultat.incident.createdAt,
        },
      },
      {
        status: resultat.cree ? 201 : 200,
        headers: { "cache-control": "no-store" },
      },
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      const status = error.code === "RESERVATION_INTROUVABLE" ? 404 : 422;
      return Response.json(
        { ok: false, erreur: error.message },
        { status },
      );
    }
    logErreur("api.voyageur.incident", error, {
      tenantId: payload.tenantId,
      reservationId: payload.reservationId,
    });
    return Response.json(
      { ok: false, erreur: "Erreur inattendue." },
      { status: 500 },
    );
  }
}
