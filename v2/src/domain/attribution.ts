const MAX = 24;

export interface Attribution {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  widget?: boolean;
  codePromo?: string | null;
  /** Référence de la demande de séjour convertie (enquiry). */
  demandeRef?: string | null;
}

/** Réduit un segment à `[a-z0-9-]`, borné, ou `null` si vide. */
export function segmentAttribution(valeur?: string | null): string | null {
  const propre = (valeur ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX);
  return propre || null;
}

/**
 * Source de réservation stockée dans `reservations.source`.
 * Priorité : code promo, puis UTM, puis demande convertie, puis widget, puis
 * direct. Format stable : `promo:CODE`, `utm:source/medium/campagne`,
 * `demande:REF`, `widget`, `direct`.
 */
export function normaliserAttribution(attribution: Attribution): string {
  const code = segmentAttribution(attribution.codePromo);
  if (code) return `promo:${code}`;

  const source = segmentAttribution(attribution.utmSource);
  if (source) {
    const parties = [
      source,
      segmentAttribution(attribution.utmMedium),
      segmentAttribution(attribution.utmCampaign),
    ].filter((partie): partie is string => Boolean(partie));
    return `utm:${parties.join("/")}`.slice(0, 60);
  }

  const demande = segmentAttribution(attribution.demandeRef);
  if (demande) return `demande:${demande}`;

  return attribution.widget ? "widget" : "direct";
}

const MOTIF_SOURCE =
  /^(direct|widget|utm:[a-z0-9-]+(?:\/[a-z0-9-]+){0,2}|promo:[a-z0-9-]{1,24}|demande:[a-z0-9-]{1,24})$/;

/** Vérifie une source déjà formatée (champ caché, import). */
export function sourceValide(source: string): boolean {
  return MOTIF_SOURCE.test(source.trim()) && source.trim().length <= 60;
}
