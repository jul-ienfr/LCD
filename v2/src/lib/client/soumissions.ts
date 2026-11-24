/**
 * Verrou des soumissions côté navigateur (FR-040, spec 006).
 *
 * Dès qu'un formulaire POST part, ses boutons sont désactivés et la zone passe
 * en état d'attente : plus de second clic possible, et l'utilisateur voit que
 * quelque chose se passe. Un rejeu dans les deux secondes est refusé côté
 * client comme côté serveur (`src/lib/server/anti-doublon.ts`) ; au-delà, une
 * correction après échec de validation reste possible.
 *
 * Sans JavaScript, rien n'est bloqué côté navigateur : le serveur seul écarte
 * le doublon. Le module ne touche ni aux formulaires GET (recherche, filtres)
 * ni aux liens.
 */

export const ATTENTE_SOUMISSION: Record<string, string> = {
  fr: "Envoi…",
  en: "Sending…",
  es: "Enviando…",
  it: "Invio…",
  de: "Senden…",
};

const FENETRE_MS = 2_000;
const ATTRIBUT_LIBELLE = "data-libelle-initial";

/** Seules les soumissions POST sont verrouillées (jamais la recherche GET). */
export function doitVerrouiller(methode: string | null | undefined): boolean {
  return (methode ?? "get").trim().toLowerCase() === "post";
}

/** Vrai si la même soumission revient trop tôt sur le même formulaire. */
export function rejeuTropRapide(
  precedent: number | undefined,
  maintenant: number,
  fenetreMs: number = FENETRE_MS,
): boolean {
  return precedent !== undefined && maintenant - precedent < fenetreMs;
}

/** Libellé d'attente dans la langue de la page, français par défaut. */
export function libelleAttente(langue: string | null | undefined): string {
  if (langue && Object.hasOwn(ATTENTE_SOUMISSION, langue)) {
    return ATTENTE_SOUMISSION[langue] as string;
  }
  return ATTENTE_SOUMISSION.fr ?? "Envoi…";
}

function languePage(): string {
  return document.documentElement.lang || "fr";
}

function restaurer(element: HTMLElement): void {
  const libelle = element.getAttribute(ATTRIBUT_LIBELLE);
  if (libelle !== null) {
    element.textContent = libelle;
    element.removeAttribute(ATTRIBUT_LIBELLE);
  }
  element.removeAttribute("aria-disabled");
  element.classList.remove("soumission-en-attente");
  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement
  ) {
    element.disabled = false;
  }
}

/**
 * Installe le verrou sur les soumissions POST de `racine`. Renvoie la fonction
 * de désinstallation (utilisée par `onMount`).
 */
export function installerVerrouSoumissions(
  racine: Document = document,
): () => void {
  let dernierEnvoi = new WeakMap<HTMLFormElement, number>();

  function onsubmit(evenement: Event): void {
    const evt = evenement as SubmitEvent;
    const form = evt.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!doitVerrouiller(form.getAttribute("method"))) return;

    const maintenant = Date.now();
    if (rejeuTropRapide(dernierEnvoi.get(form), maintenant)) {
      evt.preventDefault();
      return;
    }
    dernierEnvoi.set(form, maintenant);

    form.setAttribute("aria-busy", "true");
    form.classList.add("soumission-en-attente");
    const boutons = evt.submitter
      ? [evt.submitter]
      : [
          ...form.querySelectorAll<HTMLElement>(
            'button[type="submit"], button:not([type]), input[type="submit"]',
          ),
        ];
    const libelle = libelleAttente(languePage());
    for (const bouton of boutons) {
      if (!(bouton instanceof HTMLElement)) continue;
      bouton.classList.add("soumission-en-attente");
      if (bouton.childElementCount === 0 && bouton.textContent?.trim()) {
        bouton.setAttribute(ATTRIBUT_LIBELLE, bouton.textContent);
        bouton.textContent = libelle;
      }
    }

    // Les champs du bouton (nom/valeur) doivent encore partir avec le
    // formulaire : la désactivation attend donc la fin de l'événement.
    setTimeout(() => {
      for (const bouton of boutons) {
        if (!(bouton instanceof HTMLElement)) continue;
        bouton.setAttribute("aria-disabled", "true");
        if (
          bouton instanceof HTMLButtonElement ||
          bouton instanceof HTMLInputElement
        ) {
          bouton.disabled = true;
        }
      }
    }, 0);
  }

  function onpageshow(evenement: Event): void {
    if (!(evenement as PageTransitionEvent).persisted) return;
    for (const element of racine.querySelectorAll<HTMLElement>(
      ".soumission-en-attente",
    )) {
      restaurer(element);
    }
    for (const form of racine.querySelectorAll("form")) {
      form.removeAttribute("aria-busy");
      form.classList.remove("soumission-en-attente");
    }
    dernierEnvoi = new WeakMap();
  }

  racine.addEventListener("submit", onsubmit, true);
  window.addEventListener("pageshow", onpageshow);
  return () => {
    racine.removeEventListener("submit", onsubmit, true);
    window.removeEventListener("pageshow", onpageshow);
  };
}
