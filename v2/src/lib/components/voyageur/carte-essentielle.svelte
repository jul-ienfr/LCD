<script lang="ts">
  /**
   * Carte essentielle de l'espace voyageur (T048).
   *
   * Rend une information que le voyageur doit trouver en moins de 10 s (accès,
   * Wi-Fi, horaires, urgence, dates) avec au plus une action native : un lien
   * (`href`) ou un bouton de formulaire (`hrefFormulaire`). HTML-first : ni JS,
   * ni composant externe, cibles ≥ 44 px (`ui-bouton`).
   */
  let {
    titre,
    valeur,
    icone,
    action,
    actionNom,
    actionExterne = false,
    actionFormulaire,
    id,
  }: {
    /** Titre de la carte : rendu en `h3`, lisible au lecteur d'écran. */
    titre: string;
    /** Valeur principale, déjà formatée (jamais de HTML). */
    valeur: string;
    /** Emoji ou pictogramme textuel, décoratif. */
    icone?: string;
    /** Lien d'action (ancre interne ou URL absolue). */
    action?: string;
    /** Libellé du lien ou du bouton. */
    actionNom?: string;
    /** Ouvre dans un nouvel onglet (`target="_blank"` + `rel`). */
    actionExterne?: boolean;
    /** URL d'action d'un formulaire GET natif (recherche, itinéraire). */
    actionFormulaire?: string;
    /** Ancre de la carte, cible du sommaire. */
    id?: string;
  } = $props();

  // L'ancre de la carte (`id`) sert de cible au sommaire : l'identifiant du
  // titre en dérive pour rester unique sans empiler deux préfixes.
  const titreId = $derived(
    id
      ? `${id}-titre`
      : `carte-${titre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  );
</script>

<article
  {id}
  class="ui-carte flex min-w-0 flex-col gap-3"
  aria-labelledby={titreId}
  data-carte-essentielle
>
  <h3 id={titreId} class="flex items-center gap-2 text-sm font-semibold text-encre-douce">
    {#if icone}<span aria-hidden="true">{icone}</span>{/if}
    <span class="min-w-0 break-words">{titre}</span>
  </h3>
  <p class="min-w-0 break-words text-lg font-semibold tracking-tight">{valeur}</p>
  {#if action && actionNom}
    <a
      class="ui-bouton ui-bouton--secondaire ui-bouton--petit w-full"
      href={action}
      target={actionExterne ? "_blank" : undefined}
      rel={actionExterne ? "noopener noreferrer" : undefined}
    >
      {actionNom}
    </a>
  {:else if actionFormulaire && actionNom}
    <form class="mt-0" method="GET" action={actionFormulaire}>
      <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit w-full" type="submit">
        {actionNom}
      </button>
    </form>
  {/if}
</article>
