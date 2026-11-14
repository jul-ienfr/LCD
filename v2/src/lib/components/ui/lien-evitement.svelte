<script lang="ts">
  /**
   * Lien d'évitement « Aller au contenu » (T017).
   *
   * Premier élément focusable d'une page : il amène le focus clavier sur le
   * repère `main` (`#contenu`) sans traverser la navigation. La classe
   * `.lien-evitement` (masqué hors focus) est définie dans `src/app.css`.
   *
   * Le layout global (`+layout.svelte`) en rend déjà un : ne pas le dupliquer
   * sur une route qui hérite du layout, au risque d'annoncer deux fois le même
   * lien aux lecteurs d'écran. Cette brique sert aux surfaces rendues hors
   * layout ou à un futur passage du layout sur la primitive.
   */
  import type { Langue } from "@/lib/i18n";

  let {
    cible = "#contenu",
    libelle,
    langue = "fr",
  }: {
    /** Identifiant de la cible, avec son `#`. */
    cible?: string;
    /** Texte du lien ; par défaut, traduction de `langue`. */
    libelle?: string;
    langue?: Langue;
  } = $props();

  const LIBELLES: Record<Langue, string> = {
    fr: "Aller au contenu",
    en: "Skip to content",
    es: "Ir al contenido",
    it: "Vai al contenuto",
    de: "Zum Inhalt springen",
  };

  const texte = $derived(libelle ?? LIBELLES[langue]);
</script>

<a class="lien-evitement" href={cible} data-lien-evitement>{texte}</a>
