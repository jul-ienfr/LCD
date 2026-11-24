/**
 * Notifications in-app des résultats d'action (FR-042, spec 006).
 *
 * Chaque action laisse déjà son message contextuel dans la page ; la
 * notification le double d'un signal visible quelle que soit la position de
 * défilement, l'échec en priorité. Ce module ne touche pas au DOM : il tient
 * la file (dédoublonnage, limite, expiration des succès) et lit le résultat
 * transporté par l'URL. La racine l'affiche et l'annonce aux lecteurs d'écran.
 */

export type TonNotification = "succes" | "echec";

export interface NotificationAction {
  id: number;
  ton: TonNotification;
  texte: string;
  signature: string;
  /** Horodatage d'expiration ; absent pour un échec, qui reste affiché. */
  expireLe?: number;
}

export interface FileNotifications {
  /** Ajoute une notification ; faux si la même signature est déjà affichée. */
  ajouter(entree: { ton: TonNotification; texte: string; signature: string }): boolean;
  retirer(id: number): void;
  /** Retire les succès expirés ; renvoie le nombre retiré. */
  expirer(maintenant?: number): number;
  liste(): readonly NotificationAction[];
  taille(): number;
}

export interface OptionsFileNotifications {
  /** Nombre de notifications gardées ; un échec n'est jamais évincé par un succès. */
  limite?: number;
  /** Durée d'affichage d'un succès ; un échec reste jusqu'à fermeture. */
  dureeSuccesMs?: number;
  horloge?: () => number;
}

/** Résultat d'action lisible dans l'URL ou le formulaire. */
export type ResultatAction = "succes" | "echec" | "doublon";

/**
 * Lit le résultat d'action de la page : l'échec passe avant tout, puis le
 * doublon écarté, puis le succès (`?ok=`). Rien d'autre ne déclenche de
 * notification.
 */
export function resultatDepuisUrl(recherche: {
  has(nom: string): boolean;
  get(nom: string): string | null;
}): ResultatAction | null {
  if (recherche.has("erreur")) return "echec";
  if (recherche.get("doublon") === "1") return "doublon";
  if (recherche.has("ok")) return "succes";
  return null;
}

/** Signature stable d'un résultat : la même page ne notifie qu'une fois. */
export function signatureResultat(
  chemin: string,
  resultat: ResultatAction,
  detail = "",
): string {
  return `${chemin}|${resultat}|${detail}`;
}

export function creerFileNotifications(
  options: OptionsFileNotifications = {},
): FileNotifications {
  const limite = options.limite ?? 3;
  const dureeSuccesMs = options.dureeSuccesMs ?? 5_000;
  const horloge = options.horloge ?? Date.now;
  const vues = new Set<string>();
  let elements: NotificationAction[] = [];
  let prochainId = 1;

  function retenir(nombre: number): void {
    if (elements.length <= nombre) return;
    // Un échec ne cède jamais la place à un succès : on évince d'abord les
    // succès les plus anciens, puis, s'il le faut, l'échec le plus ancien.
    const gardes = [...elements];
    while (gardes.length > nombre) {
      const indexSucces = gardes.findIndex((element) => element.ton === "succes");
      if (indexSucces >= 0) gardes.splice(indexSucces, 1);
      else gardes.shift();
    }
    elements = gardes;
  }

  return {
    ajouter({ ton, texte, signature }): boolean {
      if (vues.has(signature)) return false;
      if (vues.size > 200) {
        const plusAncienne = vues.values().next().value;
        if (plusAncienne !== undefined) vues.delete(plusAncienne);
      }
      vues.add(signature);
      elements.push({
        id: prochainId++,
        ton,
        texte,
        signature,
        ...(ton === "succes" ? { expireLe: horloge() + dureeSuccesMs } : {}),
      });
      retenir(limite);
      return true;
    },
    retirer(id): void {
      elements = elements.filter((element) => element.id !== id);
    },
    expirer(maintenant = horloge()): number {
      const avant = elements.length;
      elements = elements.filter(
        (element) =>
          element.ton === "echec" ||
          element.expireLe === undefined ||
          element.expireLe > maintenant,
      );
      return avant - elements.length;
    },
    liste(): readonly NotificationAction[] {
      return elements;
    },
    taille(): number {
      return elements.length;
    },
  };
}

/** Ordre d'affichage : les échecs d'abord, les plus récents en tête du groupe. */
export function ordonnerNotifications(
  elements: readonly NotificationAction[],
): NotificationAction[] {
  return [...elements].sort((a, b) => {
    if (a.ton !== b.ton) return a.ton === "echec" ? -1 : 1;
    return b.id - a.id;
  });
}
