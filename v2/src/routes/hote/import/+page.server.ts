/**
 * US8 (T802) — Import CSV de logements et de réservations.
 *
 * Rapport ligne par ligne : chaque ligne refusée est renvoyée avec son numéro
 * de fichier. Les lignes valides sont créées malgré les erreurs des autres ;
 * les réservations sont contrôlées contre le surbooking avant insertion.
 */
import { withTenant } from "@/infrastructure/db/client";
import {
  analyserLogementsCsv,
  analyserReservationsCsv,
  resumeImport,
  type ErreurImport,
} from "@/domain/import-csv";
import { ErreurMetier } from "@/domain/erreurs";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const TAILLE_MAX_CSV = 2_000_000;

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  return {
    logements: logements
      .filter((logement) => logement.statut !== "archive")
      .map((logement) => ({ code: logement.code, nom: logement.nom })),
  };
};

async function lireCsv(donnees: FormData): Promise<string | null> {
  const fichier = donnees.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0) return null;
  if (fichier.size > TAILLE_MAX_CSV) return null;
  return fichier.text();
}

function messageErreur(error: unknown): string {
  if (error instanceof ErreurMetier) return error.message;
  return "Création impossible (doublon ou donnée invalide).";
}

export const actions = {
  logements: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const texte = await lireCsv(donnees);
    if (!texte) {
      return {
        type: "logements" as const,
        crees: 0,
        erreurs: [{ ligne: 0, message: "Fichier CSV absent ou supérieur à 2 Mo." }],
        message: "Aucune ligne importée.",
      };
    }

    const analyse = analyserLogementsCsv(texte);
    const erreurs: ErreurImport[] = [...analyse.erreurs];
    const depot = new DrizzleLogementRepository();
    let crees = 0;

    for (const ligne of analyse.lignes) {
      try {
        await depot.creer({
          tenantId,
          code: ligne.code,
          nom: ligne.nom,
          adresse: ligne.adresse ?? undefined,
        });
        crees += 1;
      } catch (error) {
        erreurs.push({ ligne: ligne.numero, message: messageErreur(error) });
      }
    }

    try {
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "import.csv",
          cible: "logements",
          ref: `logements:${crees}`,
          payload: { crees, erreurs: erreurs.length },
        }),
      );
    } catch (error) {
      logErreur("import.logements.audit", error, { tenantId });
    }

    return {
      type: "logements" as const,
      crees,
      erreurs,
      message: resumeImport(crees, erreurs),
    };
  },

  reservations: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const texte = await lireCsv(donnees);
    if (!texte) {
      return {
        type: "reservations" as const,
        crees: 0,
        erreurs: [{ ligne: 0, message: "Fichier CSV absent ou supérieur à 2 Mo." }],
        message: "Aucune ligne importée.",
      };
    }

    const depotLogement = new DrizzleLogementRepository();
    const depotReservation = new DrizzleReservationRepository();
    const logements = await depotLogement.listerParTenant(tenantId);
    const parCode = new Map(
      logements.map((logement) => [logement.code.toLowerCase(), logement.id]),
    );
    const analyse = analyserReservationsCsv(texte, [...parCode.keys()]);
    const erreurs: ErreurImport[] = [...analyse.erreurs];
    let crees = 0;

    for (const ligne of analyse.lignes) {
      const logementId = parCode.get(ligne.logementCode);
      if (!logementId) {
        erreurs.push({
          ligne: ligne.numero,
          message: `Logement introuvable : « ${ligne.logementCode} ».`,
        });
        continue;
      }
      try {
        const chevauche = await depotReservation.chevauche(
          tenantId,
          logementId,
          ligne.debut,
          ligne.fin,
        );
        if (chevauche) {
          erreurs.push({
            ligne: ligne.numero,
            message: "Cette réservation chevauche un séjour existant.",
          });
          continue;
        }
        await depotReservation.creer({
          tenantId,
          logementId,
          ref: ligne.ref,
          clientNom: ligne.clientNom ?? undefined,
          voyageurs: ligne.voyageurs,
          debut: ligne.debut,
          fin: ligne.fin,
          montantCentimes: ligne.montantCentimes,
          source: "import-csv",
          statut: "confirmee",
        });
        crees += 1;
      } catch (error) {
        erreurs.push({ ligne: ligne.numero, message: messageErreur(error) });
      }
    }

    try {
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "import.csv",
          cible: "reservations",
          ref: `reservations:${crees}`,
          payload: { crees, erreurs: erreurs.length },
        }),
      );
    } catch (error) {
      logErreur("import.reservations.audit", error, { tenantId });
    }

    return {
      type: "reservations" as const,
      crees,
      erreurs,
      message: resumeImport(crees, erreurs),
    };
  },
} satisfies Actions;
