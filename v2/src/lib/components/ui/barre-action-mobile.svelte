<script lang="ts">
  /**
   * Barre d'actions fixée en bas d'écran, mobile uniquement (T022).
   *
   * Contrat :
   * - `actions` est un *snippet* : la barre ne décide pas de son contenu, elle
   *   fournit le repère `nav` nommé, le positionnement et la mise à l'échelle ;
   * - elle n'existe que sous le point de rupture `md` (classe `md:hidden`) —
   *   sur grand écran, les mêmes actions sont dans l'en-tête ou la page ;
   * - elle **ne masque jamais le contenu** : un espaceur de la hauteur de la
   *   barre est rendu dans le flux (désactivable via `espaceBas={false}` si la
   *   page réserve déjà la place, par exemple `pb-28`) ;
   * - aucune action n'est inventée : sans contenu, rien n'est rendu ;
   * - jamais affichée à l'impression (`ui-noprint`), cibles ≥ 44 px, et
   *   `padding-bottom` augmenté de `env(safe-area-inset-bottom)`.
   *
   * Les trois props nommées (`appeler*`, `ecrire*`, `guide*`) reproduisent le
   * contrat de `voyageur/barre-action-voyageur.svelte` : elles ne servent que
   * lorsque `actions` n'est pas fourni, et permettent à l'espace voyageur de
   * basculer sur cette brique partagée sans changer son appel.
   */
  import type { Snippet } from "svelte";
  import type { Langue } from "@/lib/i18n";

  interface ActionBarre {
    href: string;
    libelle: string;
    icone: string;
    primaire: boolean;
  }

  let {
    actions,
    libelle,
    langue = "fr",
    appelerHref,
    appelerLibelle,
    ecrireHref,
    ecrireLibelle,
    guideHref,
    guideLibelle,
    espaceBas = true,
    desktop = false,
  }: {
    /** Contenu de la barre : un ou deux boutons, chacun dans un `<li>`. */
    actions?: Snippet;
    /** Nom accessible du repère `nav` ; par défaut, traduction de `langue`. */
    libelle?: string;
    langue?: Langue;
    /** Lien `tel:` (mode « actions nommées »). */
    appelerHref?: string;
    appelerLibelle?: string;
    /** Lien `mailto:` ou ancre (mode « actions nommées »). */
    ecrireHref?: string;
    ecrireLibelle?: string;
    /** Ancre ou lien (mode « actions nommées »). */
    guideHref?: string;
    guideLibelle?: string;
    /** Réserve la hauteur de la barre dans le flux (par défaut : oui). */
    espaceBas?: boolean;
    /** Affiche aussi la barre sur grand écran (par défaut : mobile seul). */
    desktop?: boolean;
  } = $props();

  const LIBELLES: Record<Langue, string> = {
    fr: "Actions",
    en: "Actions",
    es: "Acciones",
    it: "Azioni",
    de: "Aktionen",
  };

  function construireActions(): ActionBarre[] {
    const liste: ActionBarre[] = [];
    if (appelerHref && appelerLibelle) {
      liste.push({
        href: appelerHref,
        libelle: appelerLibelle,
        icone: "☎",
        primaire: true,
      });
    }
    if (ecrireHref && ecrireLibelle) {
      liste.push({
        href: ecrireHref,
        libelle: ecrireLibelle,
        icone: "✎",
        primaire: false,
      });
    }
    if (guideHref && guideLibelle) {
      liste.push({
        href: guideHref,
        libelle: guideLibelle,
        icone: "☰",
        primaire: false,
      });
    }
    return liste;
  }

  const actionsNommees = $derived(construireActions());
  const contenu = $derived(
    actions !== undefined || actionsNommees.length > 0,
  );
  const classesBarre = $derived(
    [
      "fixed inset-x-0 bottom-0 z-40 border-t border-bordure ui-verre ui-noprint",
      desktop ? "" : "md:hidden",
    ]
      .filter(Boolean)
      .join(" "),
  );
  const classesEspace = $derived(
    ["h-20", desktop ? "" : "md:hidden"].filter(Boolean).join(" "),
  );
</script>

{#if contenu}
  {#if espaceBas}
    <div class={classesEspace} aria-hidden="true" data-barre-action-espace></div>
  {/if}
  <nav
    class={classesBarre}
    style="padding: 0.5rem 1rem calc(0.5rem + env(safe-area-inset-bottom, 0px));"
    aria-label={libelle ?? LIBELLES[langue]}
    data-barre-action-mobile
  >
    {#if actions}
      <div class="mx-auto flex w-full max-w-2xl items-stretch gap-2">
        {@render actions()}
      </div>
    {:else}
      <ul class="mx-auto flex w-full max-w-2xl items-stretch gap-2">
        {#each actionsNommees as action (action.href + action.libelle)}
          <li class="min-w-0 flex-1">
            <a
              class="ui-bouton {action.primaire
                ? 'ui-bouton--primaire'
                : 'ui-bouton--secondaire'} w-full"
              href={action.href}
            >
              <span aria-hidden="true">{action.icone}</span>
              <span class="truncate">{action.libelle}</span>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </nav>
{/if}
