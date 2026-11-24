import { createHash } from "node:crypto";

/**
 * Anti-doublon des soumissions de formulaire (FR-040, spec 006).
 *
 * Un double clic, un double envoi réseau ou un rejeu immédiat ne doivent pas
 * créer deux lignes : le serveur mémorise l'empreinte d'une soumission pendant
 * une courte fenêtre et renvoie le doublon vers la page sans réexécuter
 * l'action. L'empreinte couvre l'auteur, le chemin, l'action SvelteKit et les
 * champs du formulaire, puis est hachée : aucun mot de passe ni contenu de
 * formulaire n'est conservé en clair.
 */

export interface SoumissionObservee {
  /** Auteur de la requête : identifiant de session ou adresse cliente. */
  utilisateur: string;
  /** Chemin de la page qui reçoit la soumission. */
  chemin: string;
  /** Nom de l'action SvelteKit, ou chaîne vide pour une soumission de page. */
  action: string;
  /** Champs du formulaire, valeurs texte uniquement. */
  champs?: Iterable<readonly [string, string]>;
}

/** Empreinte stable et non réversible d'une soumission. */
export function empreinteSoumission(soumission: SoumissionObservee): string {
  const champs = [...(soumission.champs ?? [])]
    .map(([nom, valeur]) => `${nom}=${valeur}`)
    .sort();
  const matiere = [
    soumission.utilisateur,
    soumission.chemin,
    soumission.action,
    ...champs,
  ].join("\u0000");
  return createHash("sha256").update(matiere).digest("hex");
}

export interface OptionsRegistreAntiDoublon {
  /** Durée pendant laquelle une même empreinte est considérée comme doublon. */
  fenetreMs?: number;
  /** Nombre maximal d'empreintes mémorisées avant purge des expirées. */
  limite?: number;
  /** Horloge injectable, pour les tests. */
  horloge?: () => number;
}

export interface RegistreAntiDoublon {
  /**
   * Mémorise l'empreinte ; vrai si c'est la première fois dans la fenêtre,
   * faux si la même soumission vient déjà d'être acceptée.
   */
  enregistrer(empreinte: string): boolean;
  /** Nombre d'empreintes actives (diagnostic et tests). */
  taille(): number;
}

export function creerRegistreAntiDoublon(
  options: OptionsRegistreAntiDoublon = {},
): RegistreAntiDoublon {
  const fenetreMs = options.fenetreMs ?? 2_000;
  const limite = options.limite ?? 2_000;
  const horloge = options.horloge ?? Date.now;
  const vues = new Map<string, number>();

  function purger(maintenant: number): void {
    for (const [empreinte, expireLe] of vues) {
      if (expireLe <= maintenant) vues.delete(empreinte);
    }
  }

  return {
    enregistrer(empreinte: string): boolean {
      const maintenant = horloge();
      const expireLe = vues.get(empreinte);
      if (expireLe !== undefined && expireLe > maintenant) return false;
      if (expireLe !== undefined) vues.delete(empreinte);
      if (vues.size >= limite) {
        purger(maintenant);
        // Une rafale soutenue reste bornée : les plus anciennes empreintes
        // cèdent la place, la fenêtre courte rend cette perte sans effet.
        while (vues.size >= limite) {
          const plusAncienne = vues.keys().next().value;
          if (plusAncienne === undefined) break;
          vues.delete(plusAncienne);
        }
      }
      vues.set(empreinte, maintenant + fenetreMs);
      return true;
    },
    taille(): number {
      purger(horloge());
      return vues.size;
    },
  };
}
