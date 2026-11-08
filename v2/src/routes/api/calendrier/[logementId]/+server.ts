import { createHash } from "node:crypto";
import { ajouterJours } from "@/domain/calendrier";
import {
  appliquerBuffer,
  exclureFlux,
} from "@/domain/disponibilite-canal";
import { genererCalendrierIcs } from "@/domain/ics-export";
import { jourParis } from "@/lib/date-paris";
import { DrizzleBlocageRepository } from "@/infrastructure/db/repositories/blocage-repository";
import { DrizzleCanalRepository } from "@/infrastructure/db/repositories/canal-repository";
import { DrizzleFluxIcsRepository } from "@/infrastructure/db/repositories/flux-ics-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { verifierTokenCalendrier } from "@/lib/calendrier-token";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, url, request }) => {
  const logementId = params.logementId;
  const token = url.searchParams.get("t") ?? "";
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

  let bufferJours = 0;
  let nomCanal = "";
  let fluxCibleId: string | null = null;
  let canalMisAJour: Date | null = null;
  if (payload.canalId) {
    const canal = await new DrizzleCanalRepository().trouverParId(
      payload.tenantId,
      payload.canalId,
    );
    if (
      !canal ||
      canal.logementId !== logementId ||
      !canal.actif ||
      !canal.exportActif
    ) {
      return new Response("Canal introuvable ou désactivé.", {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    }
    bufferJours = canal.bufferJours;
    nomCanal = ` — ${canal.libelle}`;
    canalMisAJour = canal.updatedAt;
    const fluxCanal = (
      await new DrizzleFluxIcsRepository().listerParLogement(
        payload.tenantId,
        logementId,
      )
    ).find((entree) => entree.canalId === payload.canalId);
    fluxCibleId = fluxCanal?.id ?? null;
  }

  const [reservations, blocages, tenant] = await Promise.all([
    new DrizzleReservationRepository().listerTous(payload.tenantId),
    new DrizzleBlocageRepository().listerTous(payload.tenantId),
    new DrizzleTenantRepository().trouver(payload.tenantId),
  ]);

  const reservationsLogement = exclureFlux(
    reservations.filter(
      (reservation) =>
        reservation.logementId === logementId &&
        reservation.statut !== "annulee",
    ),
    fluxCibleId,
  );
  const blocagesLogement = exclureFlux(
    blocages.filter((blocage) => blocage.logementId === logementId),
    fluxCibleId,
  );

  const debutSuspension = jourParis();
  const evenementsBruts = [
    // Ferme le flux ICS pendant un arrêt commercial global, en plus du
    // blocage de la réservation directe et de la poussée ARI.
    ...(tenant?.ventesSuspendues
      ? [
          {
            uid: `suspension-${logementId}@lcd-parc`,
            debut: debutSuspension,
            fin: ajouterJours(debutSuspension, 730),
            titre: "Ventes suspendues",
            description: tenant.ventesSuspenduesMotif
              ? `Motif : ${tenant.ventesSuspenduesMotif}`
              : "Arrêt commercial global",
            statut: "TENTATIVE" as const,
          },
        ]
      : []),
    ...reservationsLogement.map((reservation) => ({
      uid: `resa-${reservation.id}@lcd-parc`,
      debut: reservation.debut,
      fin: reservation.fin,
      titre: `Réservation ${reservation.ref}`,
      description: reservation.source ? `Source : ${reservation.source}` : null,
      statut: "CONFIRMED" as const,
    })),
    ...blocagesLogement.map((blocage) => ({
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
  const evenements = appliquerBuffer(evenementsBruts, bufferJours);

  const dates = [
    ...reservationsLogement.map((reservation) => reservation.updatedAt),
    ...blocagesLogement.map((blocage) => blocage.updatedAt),
    ...(canalMisAJour ? [canalMisAJour] : []),
  ];
  const derniereModification =
    dates.length > 0
      ? new Date(Math.max(...dates.map((date) => date.getTime())))
      : null;

  // ETag stable : il ne dépend pas du DTSTAMP (qui change à chaque rendu).
  const etag = `"${createHash("sha256")
    .update(
      JSON.stringify({ nom: `${logement.nom}${nomCanal}`, evenements }),
    )
    .digest("base64url")
    .slice(0, 32)}"`;

  if (
    request.headers
      .get("if-none-match")
      ?.split(",")
      .some((valeur) => valeur.trim().replace(/^W\//u, "") === etag)
  ) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "private, max-age=60, must-revalidate",
      },
    });
  }

  const ics = genererCalendrierIcs(
    `${logement.nom}${nomCanal}`,
    evenements,
    derniereModification ?? undefined,
  );
  const nomFichier = `lcd-${logement.code.replace(/[^a-zA-Z0-9_-]/gu, "-")}.ics`;

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${nomFichier}"`,
      "Content-Language": "fr",
      "Cache-Control": "private, max-age=60, must-revalidate",
      ETag: etag,
      ...(derniereModification
        ? { "Last-Modified": derniereModification.toUTCString() }
        : {}),
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
};
