/**
 * File d'actions terrain hors ligne (spec 006, FR-045).
 *
 * En parité avec le voyageur, l'intervenant garde son pointage quand le réseau
 * tombe : le geste est mis en file sur l'appareil, le bandeau l'annonce, et le
 * retour du réseau rejoue chaque pointage avec son horodatage local. Le serveur
 * (`PointerMission`) accepte cet horodatage jusqu'à sept jours et ignore un
 * pointage déjà enregistré : un rejeu après une réponse perdue est sans effet.
 *
 * La logique de file est pure (testable sans navigateur) ; seule
 * `installerFileTerrain` touche au DOM et au stockage local.
 */

export type SensPointageFile = "debut" | "fin";

export interface ActionPointageFile {
  /** Clé stable : un même sens pour une mission ne s'empile jamais deux fois. */
  cle: string;
  missionId: string;
  sens: SensPointageFile;
  /** Horodatage local ISO 8601 du geste, pas celui de l'envoi. */
  horodatageLocal: string;
}

export const CLE_STOCKAGE_FILE_TERRAIN = "lcd-terrain-file";

export const clePointage = (missionId: string, sens: SensPointageFile): string =>
  `${missionId}:${sens}`;

/** Ajoute une action ou remplace celle de même clé ; l'ordre d'arrivée est gardé. */
export function ajouterAction(
  file: readonly ActionPointageFile[],
  action: ActionPointageFile,
): ActionPointageFile[] {
  const index = file.findIndex((entree) => entree.cle === action.cle);
  if (index === -1) return [...file, action];
  const copie = [...file];
  copie[index] = action;
  return copie;
}

export function retirerAction(
  file: readonly ActionPointageFile[],
  cle: string,
): ActionPointageFile[] {
  return file.filter((entree) => entree.cle !== cle);
}

const sensValide = (valeur: unknown): valeur is SensPointageFile =>
  valeur === "debut" || valeur === "fin";

/** Relit le stockage sans jamais lever : une entrée corrompue est ignorée. */
export function lireFile(valeur: string | null | undefined): ActionPointageFile[] {
  if (!valeur) return [];
  let brut: unknown;
  try {
    brut = JSON.parse(valeur);
  } catch {
    return [];
  }
  if (!Array.isArray(brut)) return [];
  return brut.flatMap((entree) => {
    if (typeof entree !== "object" || entree === null) return [];
    const candidate = entree as Record<string, unknown>;
    const missionId = candidate.missionId;
    const sens = candidate.sens;
    const horodatageLocal = candidate.horodatageLocal;
    if (typeof missionId !== "string" || !missionId) return [];
    if (!sensValide(sens)) return [];
    if (typeof horodatageLocal !== "string" || !horodatageLocal) return [];
    return [
      {
        cle: clePointage(missionId, sens),
        missionId,
        sens,
        horodatageLocal,
      },
    ];
  });
}

export function serialiserFile(file: readonly ActionPointageFile[]): string {
  return JSON.stringify(file);
}

/** Valeur ISO 8601 locale d'un geste : champ saisi sinon horloge de l'appareil. */
export function horodatageDuGeste(
  saisie: string | null | undefined,
  maintenant: Date,
): string {
  const texte = (saisie ?? "").trim();
  if (texte) {
    const date = new Date(texte);
    if (Number.isFinite(date.getTime())) return date.toISOString();
  }
  return maintenant.toISOString();
}

const remplacer = (modele: string, nombre: number): string =>
  modele.split("__N__").join(String(nombre));

interface ElementsTerrain {
  bandeau: HTMLElement | null;
  horsLigne: HTMLElement | null;
  file: HTMLElement | null;
  etat: HTMLElement | null;
}

function elements(): ElementsTerrain {
  return {
    bandeau: document.querySelector<HTMLElement>("[data-terrain-bandeau]"),
    horsLigne: document.querySelector<HTMLElement>("[data-terrain-hors-ligne]"),
    file: document.querySelector<HTMLElement>("[data-terrain-file]"),
    etat: document.querySelector<HTMLElement>("[data-terrain-etat]"),
  };
}

/**
 * Installe l'indicateur et la file : interception des pointages hors ligne,
 * affichage de l'état, rejeu au retour du réseau. Sans JavaScript, les
 * formulaires restent de vrais POST (le serveur refuse seulement la panne).
 */
export function installerFileTerrain(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const lireStockage = (): ActionPointageFile[] =>
    lireFile(window.localStorage.getItem(CLE_STOCKAGE_FILE_TERRAIN));

  const ecrireStockage = (file: readonly ActionPointageFile[]): void => {
    window.localStorage.setItem(CLE_STOCKAGE_FILE_TERRAIN, serialiserFile(file));
  };

  const ui = elements();

  const rafraichir = (message?: string): void => {
    const file = lireStockage();
    const horsLigne = window.navigator.onLine === false;

    if (ui.horsLigne) ui.horsLigne.hidden = !horsLigne;

    if (ui.file) {
      const modele = ui.file.dataset.modeleAttente ?? "";
      ui.file.hidden = file.length === 0;
      ui.file.textContent = remplacer(modele, file.length);
    }

    if (ui.etat) {
      ui.etat.textContent = message ?? "";
      ui.etat.hidden = !message;
    }

    if (ui.bandeau) {
      ui.bandeau.hidden = !horsLigne && file.length === 0 && !message;
    }
  };

  let rejeuEnCours = false;

  const rejouer = async (): Promise<void> => {
    if (rejeuEnCours || window.navigator.onLine === false) return;
    let file = lireStockage();
    if (file.length === 0) return;
    rejeuEnCours = true;
    let envoyes = 0;
    let echec = false;

    for (const action of file) {
      try {
        const reponse = await fetch("/api/terrain/pointage", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            missionId: action.missionId,
            sens: action.sens,
            horodatageLocal: action.horodatageLocal,
          }),
        });
        // 2xx : accepté ; 4xx : refus définitif (mission annulée, droits) :
        // conserver l'action bloquerait la file pour toujours.
        if (reponse.ok || (reponse.status >= 400 && reponse.status < 500)) {
          file = retirerAction(file, action.cle);
          ecrireStockage(file);
          if (reponse.ok) envoyes += 1;
        } else {
          echec = true;
        }
      } catch {
        // Réseau encore instable : l'action reste en file.
        echec = true;
      }
    }

    rejeuEnCours = false;

    if (envoyes > 0) {
      const modele = ui.file?.dataset.modeleSynchronisee ?? "";
      rafraichir(remplacer(modele, envoyes));
    } else {
      rafraichir(ui.etat?.dataset.modeleEchec ?? undefined);
    }
    if (echec && envoyes === 0) {
      const reste = lireStockage();
      if (ui.bandeau) ui.bandeau.hidden = false;
      if (ui.file) {
        ui.file.hidden = reste.length === 0;
        ui.file.textContent = remplacer(ui.file.dataset.modeleAttente ?? "", reste.length);
      }
    }
  };

  document.addEventListener("submit", (evenement) => {
    const formulaire = evenement.target;
    if (
      !(formulaire instanceof HTMLFormElement) ||
      !formulaire.matches("form[data-file-terrain]")
    ) {
      return;
    }
    if (window.navigator.onLine !== false) return;

    evenement.preventDefault();
    const donnees = new FormData(formulaire);
    const missionId = String(donnees.get("missionId") ?? "").trim();
    const sens = donnees.get("sens");
    if (!missionId || (sens !== "debut" && sens !== "fin")) return;

    const action: ActionPointageFile = {
      cle: clePointage(missionId, sens),
      missionId,
      sens,
      horodatageLocal: horodatageDuGeste(
        String(donnees.get("horodatageLocal") ?? ""),
        new Date(),
      ),
    };
    const file = ajouterAction(lireStockage(), action);
    ecrireStockage(file);

    const bouton = formulaire.querySelector<HTMLButtonElement>("button[type=submit]");
    if (bouton) {
      bouton.disabled = true;
      bouton.setAttribute("aria-busy", "true");
    }
    rafraichir();
  });

  window.addEventListener("online", () => {
    rafraichir();
    void rejouer();
  });
  window.addEventListener("offline", () => rafraichir());

  rafraichir();
  void rejouer();
}
