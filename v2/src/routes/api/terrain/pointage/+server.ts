import { PointerMission, type SensPointage } from "@/application/use-cases/pointer-mission";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleMissionRepository } from "@/infrastructure/db/repositories/mission-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { emettreEvenement } from "@/lib/evenements";
import { logErreur } from "@/lib/logger";
import { tenantIdDeSession, verifierAccesApi } from "@/lib/server/session";
import type { RequestHandler } from "./$types";

/**
 * Rejeu d'un pointage mis en file hors ligne (spec 006, FR-045).
 *
 * La file du navigateur n'envoie que `missionId`, `sens` et l'horodatage local
 * du geste. `PointerMission` valide la fenêtre (sept jours), marque la source
 * `hors_ligne` et ignore un pointage déjà enregistré : un rejeu après réponse
 * perdue est sans effet. Les contrôles d'accès et l'audit sont ceux de la page
 * prestataire.
 */

const TAILLE_MAX = 4_000;

const json = (corps: unknown, status: number) =>
  new Response(JSON.stringify(corps), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

export const POST: RequestHandler = async ({ request, locals }) => {
  const refus = verifierAccesApi(locals.session, ["presta", "admin", "hote"]);
  if (refus) return refus;

  const session = locals.session!;
  const tenantId = tenantIdDeSession(session);

  const longueur = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(longueur) && longueur > TAILLE_MAX) {
    return json({ ok: false, erreur: "Payload trop volumineux." }, 413);
  }

  let charge: unknown;
  try {
    charge = await request.json();
  } catch {
    return json({ ok: false, erreur: "JSON invalide." }, 400);
  }
  if (typeof charge !== "object" || charge === null) {
    return json({ ok: false, erreur: "Corps invalide." }, 400);
  }

  const { missionId, sens, horodatageLocal } = charge as {
    missionId?: unknown;
    sens?: unknown;
    horodatageLocal?: unknown;
  };
  if (typeof missionId !== "string" || !missionId) {
    return json({ ok: false, erreur: "Mission manquante." }, 422);
  }
  if (sens !== "debut" && sens !== "fin") {
    return json({ ok: false, erreur: "Sens de pointage inconnu." }, 422);
  }

  try {
    const repo = new DrizzleMissionRepository();
    const mission = await repo.trouverParId(tenantId, missionId);
    if (!mission) {
      return json({ ok: false, erreur: "Mission introuvable." }, 404);
    }
    if (session.user.role === "presta" && mission.assignedUserId !== session.user.id) {
      return json({ ok: false, erreur: "Mission non attribuée." }, 403);
    }

    const resultat = await new PointerMission(repo).executer({
      tenantId,
      missionId,
      sens: sens as SensPointage,
      horodatageLocal:
        typeof horodatageLocal === "string" && horodatageLocal.trim()
          ? horodatageLocal
          : null,
      maintenant: new Date(),
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "mission.pointage",
        cible: resultat.mission.id,
        ref: resultat.mission.ref,
        payload: {
          sens,
          source:
            sens === "debut"
              ? resultat.mission.debutReelSource
              : resultat.mission.finReelleSource,
          debutReel: resultat.mission.debutReel?.toISOString() ?? null,
          finReelle: resultat.mission.finReelle?.toISOString() ?? null,
          dureeReelleMinutes: resultat.dureeReelleMinutes,
          ecartMinutes: resultat.ecartMinutes,
          rejeuHorsLigne: true,
        },
      }),
    );
    await emettreEvenement(tenantId, "mission.status", {
      missionId: resultat.mission.id,
      ref: resultat.mission.ref,
      statut: resultat.mission.statut,
      logementId: resultat.mission.logementId,
      date: resultat.mission.date,
    });

    return json(
      {
        ok: true,
        mission: {
          id: resultat.mission.id,
          ref: resultat.mission.ref,
          statut: resultat.mission.statut,
        },
      },
      200,
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return json({ ok: false, erreur: error.message }, 422);
    }
    logErreur("api.terrain.pointage", error, { tenantId, missionId });
    return json({ ok: false, erreur: "Erreur inattendue." }, 500);
  }
};
