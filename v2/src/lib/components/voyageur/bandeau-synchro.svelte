<script lang="ts">
  /**
   * Bandeau « dernière mise à jour » (T054).
   *
   * La page voyageur est rendue côté serveur (`csr = false`) : la date et
   * l'heure de rendu sont donc celles de la réponse mise en cache par le
   * service worker. Hors ligne, le voyageur voit ainsi **quand** la page qu'il
   * consulte a été produite, dans son fuseau (Europe/Paris, comme le reste de
   * l'application) et sans JavaScript.
   *
   * L'information est aussi exposée en ISO dans `datetime` (lecture machine et
   * tests), et le message hors ligne remplit le même bloc au retour du réseau.
   */
  let {
    libelle,
    iso,
    langue = "fr",
    horsLigneLibelle,
  }: {
    /** Libellé traduit, ex. « Dernière mise à jour ». */
    libelle: string;
    /** Instant de rendu, au format ISO 8601 (fourni par le serveur). */
    iso: string;
    /** Code langue pour le formatage local (`fr`, `en`, ...). */
    langue?: string;
    /** Message affiché en mode hors ligne. */
    horsLigneLibelle: string;
  } = $props();

  const formatDate = (valeur: Date, code: string) =>
    new Intl.DateTimeFormat(code, {
      timeZone: "Europe/Paris",
      dateStyle: "long",
      timeStyle: "short",
    }).format(valeur);

  const date = $derived(new Date(iso));
  const lisible = $derived(formatDate(date, langue));
  const lisibleFr = $derived(formatDate(date, "fr"));
</script>

<div class="bandeau-synchro ui-noprint" data-bandeau-synchro>
  <p class="text-xs text-encre-faine">
    {libelle} : <time datetime={iso} data-synchro-locale={lisibleFr}>{lisible}</time>
  </p>
  <p
    class="mt-1 text-xs text-alerte"
    data-hors-ligne
    data-hors-ligne-libelle={horsLigneLibelle}
    role="status"
    hidden
  >
    {horsLigneLibelle}
  </p>
</div>

<style>
  .bandeau-synchro {
    border-top: 1px solid var(--bordure);
    padding-top: 0.75rem;
  }

  @media print {
    .bandeau-synchro {
      display: none !important;
    }
  }
</style>
