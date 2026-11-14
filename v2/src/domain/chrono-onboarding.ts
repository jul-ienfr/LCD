/**
 * T810 — chrono d'onboarding.
 *
 * Calcule, à partir du journal d'audit, le temps écoulé entre les étapes
 * réellement franchies par un tenant. Aucune mesure n'est inventée : une étape
 * absente reste absente et n'est pas comptée comme instantanée.
 */

export type EtapeChronoCode =
  | "debut"
  | "logement"
  | "copro"
  | "publication"
  | "reservation_test";

export interface EvenementChrono {
  action: string;
  createdAt: Date;
  payload?: Record<string, unknown> | null;
}

export interface EtapeChrono {
  code: EtapeChronoCode;
  libelle: string;
  at: Date | null;
  /** Durée depuis l'étape précédente franchie, en millisecondes. */
  dureeMs: number | null;
  /** Durée depuis le début de l'onboarding, en millisecondes. */
  depuisDebutMs: number | null;
}

export interface ChronoOnboarding {
  debut: Date;
  etapes: EtapeChrono[];
  /** Durée totale jusqu'à la dernière étape franchie (ou maintenant). */
  totalMs: number;
  termine: boolean;
}

const LIBELLES: Record<EtapeChronoCode, string> = {
  debut: "Création du compte",
  logement: "Premier logement",
  copro: "Copropriété vérifiée",
  publication: "Logement publié",
  reservation_test: "Réservation test",
};

function premiereEtape(
  evenements: readonly EvenementChrono[],
  predicat: (evenement: EvenementChrono) => boolean,
): Date | null {
  for (const evenement of evenements) {
    if (predicat(evenement)) return evenement.createdAt;
  }
  return null;
}

export function construireChrono(
  debut: Date,
  evenements: readonly EvenementChrono[],
  maintenant: Date = new Date(),
): ChronoOnboarding {
  const tries = [...evenements].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const jalons: Array<{ code: EtapeChronoCode; at: Date | null }> = [
    { code: "debut", at: debut },
    {
      code: "logement",
      at: premiereEtape(tries, (e) => e.action === "logement.creer"),
    },
    {
      code: "copro",
      at: premiereEtape(
        tries,
        (e) => e.action === "logement.copro" && e.payload?.verifiee === true,
      ),
    },
    {
      code: "publication",
      at: premiereEtape(
        tries,
        (e) =>
          e.action === "logement.publication" &&
          e.payload?.publication === "publiee",
      ),
    },
    {
      code: "reservation_test",
      at: premiereEtape(tries, (e) => e.action === "reservation.test_creer"),
    },
  ];

  let precedent: Date | null = null;
  const etapes = jalons.map((jalon) => {
    const dureeMs =
      jalon.at && precedent
        ? Math.max(0, jalon.at.getTime() - precedent.getTime())
        : null;
    const depuisDebutMs = jalon.at
      ? Math.max(0, jalon.at.getTime() - debut.getTime())
      : null;
    if (jalon.at) precedent = jalon.at;
    return {
      code: jalon.code,
      libelle: LIBELLES[jalon.code],
      at: jalon.at,
      dureeMs,
      depuisDebutMs,
    };
  });

  const dernier = [...etapes]
    .reverse()
    .find((etape) => etape.at !== null)?.at;
  const totalMs = Math.max(
    0,
    (dernier ?? maintenant).getTime() - debut.getTime(),
  );
  return {
    debut,
    etapes,
    totalMs,
    termine: etapes.every((etape) => etape.at !== null),
  };
}

export function formaterDureeChrono(ms: number | null): string {
  if (ms === null) return "—";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const heures = Math.floor(minutes / 60);
  const resteMinutes = minutes % 60;
  if (heures < 24) {
    return resteMinutes > 0 ? `${heures} h ${resteMinutes} min` : `${heures} h`;
  }
  const jours = Math.floor(heures / 24);
  const resteHeures = heures % 24;
  return resteHeures > 0 ? `${jours} j ${resteHeures} h` : `${jours} j`;
}
