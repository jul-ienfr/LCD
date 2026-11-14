<script lang="ts">
  /**
   * Sélecteur de langue public (T035).
   *
   * Cinq liens GET `?lang=xx` : aucun JavaScript, aucun menu déroulant dépendant
   * du client, la langue est résolue côté serveur (`langueRequete`). Chaque lien
   * conserve le chemin courant (`chemin`), porte `hreflang`, et la langue active
   * est signalée par `aria-current="true"` — jamais par la seule couleur.
   *
   * Cibles ≥ 44 px (`ui-puce` / `ui-puce-active`, `min-w-11`), libellés lisibles :
   * le code visible est complété par le nom natif de la langue en texte pour
   * lecteurs d'écran, ce qui satisfait « label in name ». Les deux classes de
   * puce garantissent le contraste du texte (`--accent-fonce` sur
   * `--accent-douce`) relevé par axe en T080.
   */
  import { LANGUES, type Langue } from "@/lib/i18n";

  let {
    langue,
    libelle = "Choisir la langue",
    langues = LANGUES,
    chemin = "",
    classes = "flex flex-wrap items-center gap-1",
  }: {
    /** Langue affichée par la page. */
    langue: Langue;
    /** Nom accessible du repère `nav`. */
    libelle?: string;
    /** Langues proposées, dans l'ordre d'affichage. */
    langues?: readonly Langue[];
    /** Chemin conservé par les liens (par défaut : URL courante, requête ôtée). */
    chemin?: string;
    /** Classes du conteneur : la page décide de la place du sélecteur. */
    classes?: string;
  } = $props();

  /** Noms natifs : un lien de langue se lit dans la langue qu'il propose. */
  const NOMS: Record<Langue, string> = {
    fr: "Français",
    en: "English",
    es: "Español",
    it: "Italiano",
    de: "Deutsch",
  };
</script>

<nav class={classes} aria-label={libelle} data-selecteur-langue>
  {#each langues as code (code)}
    <a
      class="min-w-11 font-semibold uppercase tracking-wide {code === langue
        ? 'ui-puce-active'
        : 'ui-puce'}"
      href={`${chemin}?lang=${code}`}
      hreflang={code}
      lang={code}
      aria-current={code === langue ? "true" : undefined}
    >
      {code}
      <span class="sr-only">&nbsp;{NOMS[code]}</span>
    </a>
  {/each}
</nav>
