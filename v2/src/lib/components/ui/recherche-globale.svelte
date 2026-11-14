<script lang="ts">
  /**
   * Recherche globale (T019).
   *
   * Props :
   * - `valeur` : valeur initiale du champ `q` (conservée au rendu serveur).
   * - `action` : cible du formulaire GET (défaut `/hote/recherche`).
   * - `libelle` : libellé visible et nom accessible du champ (défaut
   *   « Rechercher (référence, logement, voyageur) »).
   * - `libelleBouton` : nom accessible du bouton d'envoi (défaut « Rechercher »).
   *
   * Sans JavaScript : formulaire GET natif, champ nommé `q`, bouton de 44 px
   * minimum. Aucun gestionnaire client, aucune île.
   */
  let {
    valeur = "",
    action = "/hote/recherche",
    libelle = "Rechercher (référence, logement, voyageur)",
    libelleBouton = "Rechercher",
  }: {
    valeur?: string;
    action?: string;
    libelle?: string;
    libelleBouton?: string;
  } = $props();
</script>

<form class="flex flex-wrap items-end gap-2" method="get" action={action} role="search">
  <div class="min-w-0 flex-1">
    <label class="ui-label" for="recherche-globale-q">{libelle}</label>
    <input
      id="recherche-globale-q"
      class="ui-champ mt-1.5"
      type="search"
      name="q"
      value={valeur}
      autocomplete="off"
      enterkeyhint="search"
      maxlength="64"
      minlength="2"
      spellcheck="false"
    />
  </div>
  <button
    class="ui-bouton ui-bouton--secondaire min-h-11 min-w-11 shrink-0"
    type="submit"
    aria-label={libelleBouton}
  >
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8.75" cy="8.75" r="5.25"></circle>
      <path d="M12.75 12.75 17 17"></path>
    </svg>
    <span class="sr-only">{libelleBouton}</span>
  </button>
</form>
