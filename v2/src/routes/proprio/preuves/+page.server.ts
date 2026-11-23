/**
 * Écran `/proprio/preuves` (spec 006, FR-037).
 *
 * La preuve des interventions d'un logement, telle que le mandat l'ouvre à son
 * propriétaire : rien, le résumé (date, type, état de la preuve) ou le détail
 * complet (pointage réel, motif de refus) et les photos. Le filtrage est déjà
 * fait par le cas d'usage ; cet écran ne fait que mettre en libellés.
 *
 * La page est réservée au rôle `proprietaire` : c'est un espace personnel, il
 * n'a pas de vue « tous logements ».
 */
import { ListerPreuvesProprietaire } from "@/application/use-cases/preuves-proprietaire";
import { LIBELLES_PHASE_PHOTO } from "@/domain/photo-preuve";
import { LIBELLES_STATUT_PREUVE } from "@/domain/preuve-intervention";
import type { StatutMission, TypeMission } from "@/domain/mission";
import { formaterDuree } from "@/domain/pointage";
import { LIBELLES_VISIBILITE_PREUVES } from "@/domain/visibilite-proprietaire";
import { DrizzleLogementProprietaireRepository } from "@/infrastructure/db/repositories/logement-proprietaire-repository";
import { DrizzleMissionRepository } from "@/infrastructure/db/repositories/mission-repository";
import { DrizzlePhotoPreuveRepository } from "@/infrastructure/db/repositories/photo-preuve-repository";
import { heureParis, jourParis } from "@/lib/date-paris";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

const LIBELLES_TYPE: Record<TypeMission, string> = {
  menage: "Ménage",
  maintenance: "Maintenance",
  accueil: "Accueil",
  autre: "Autre",
};

const LIBELLES_STATUT: Record<StatutMission, string> = {
  planifiee: "Planifiée",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

/** Horodatage de pointage lisible : « 2026-11-23 09:12 ». */
function horodatage(date: Date): string {
  return `${jourParis(date)} ${heureParis(date)}`;
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["proprietaire"]);
  const tenantId = tenantIdDeSession(session);

  const logements = await new ListerPreuvesProprietaire(
    new DrizzleLogementProprietaireRepository(),
    new DrizzleMissionRepository(),
    new DrizzlePhotoPreuveRepository(),
  ).executer(tenantId, session.user.id);

  return {
    nom: session.user.name,
    logements: logements.map((logement) => ({
      logementId: logement.logementId,
      logementNom: logement.logementNom,
      visibilite: logement.visibilite,
      visibiliteLibelle: LIBELLES_VISIBILITE_PREUVES[logement.visibilite],
      visible: logement.visible,
      interventions: logement.interventions.map((intervention) => ({
        missionId: intervention.missionId,
        ref: intervention.ref,
        typeLibelle: LIBELLES_TYPE[intervention.type],
        date: intervention.date,
        statutLibelle: LIBELLES_STATUT[intervention.statut],
        preuveStatut: intervention.preuveStatut,
        preuveLibelle: LIBELLES_STATUT_PREUVE[intervention.preuveStatut],
        motifRefus: intervention.motifRefus,
        debutReel: intervention.debutReel
          ? horodatage(intervention.debutReel)
          : null,
        finReelle: intervention.finReelle
          ? horodatage(intervention.finReelle)
          : null,
        dureeReelle:
          intervention.dureeReelleMinutes === null
            ? null
            : formaterDuree(intervention.dureeReelleMinutes),
        pointageHorsLigne: intervention.pointageHorsLigne,
      })),
      photos: logement.photos.map((photo) => ({
        id: photo.id,
        url: photo.url,
        phaseLibelle: LIBELLES_PHASE_PHOTO[photo.phase],
        piece: photo.piece,
        creeLe: photo.creeLe,
      })),
    })),
  };
};
