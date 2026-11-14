<script lang="ts">
  /**
   * En-tête public commun (T036).
   *
   * Trois principes :
   * - **au plus cinq entrées de navigation** : le retour, les liens passés par la
   *   page, `Aide` et `Mentions`, plafonnés par `maxEntrees` (l'accès
   *   propriétaire, discret, occupe la cinquième place quand il est affiché) ;
   * - **sélecteur de langue facultatif** : affiché dès qu'une `langue` est
   *   fournie, ou forcé par `afficherLangue` ; les liens conservent le chemin
   *   courant ;
   * - **accès propriétaire discret** : un lien de faible poids visuel vers
   *   `/login`, jamais un bouton concurrent du parcours voyageur.
   *
   * Toutes les props nouvelles sont optionnelles et leurs libellés par défaut
   * sont français : les appelants existants (espace voyageur, réservation)
   * gardent exactement le rendu attendu. La langue active est signalée par
   * `aria-current="page"`, stylé par `.ui-nav-lien[aria-current="page"]`.
   */
  import type { Snippet } from "svelte";
  import { page } from "$app/state";
  import { traductionsPubliques, type Langue } from "@/lib/i18n-public";
  import SelecteurLangue from "@/lib/components/ui/selecteur-langue.svelte";

  interface LienEntete {
    href: string;
    libelle: string;
  }

  let {
    nom,
    logoUrl,
    retourHref = "/",
    retourLibelle,
    liens = [],
    actions,
    langue,
    afficherLangue,
    accesProprietaire = true,
    maxEntrees = 5,
  }: {
    nom: string;
    logoUrl?: string | null;
    /** Lien de retour ; il occupe la première entrée. */
    retourHref?: string;
    /** Libellé du retour ; par défaut « Accueil » (traduit si `langue`). */
    retourLibelle?: string;
    /** Entrées supplémentaires, insérées après le retour. */
    liens?: LienEntete[];
    /** Contenu additionnel rendu en fin de navigation (bouton, formulaire). */
    actions?: Snippet;
    /** Langue des libellés ; active aussi le sélecteur de langue. */
    langue?: Langue;
    /** Force ou masque le sélecteur de langue. */
    afficherLangue?: boolean;
    /** Affiche l'accès discret à l'espace propriétaire. */
    accesProprietaire?: boolean;
    /** Plafond d'entrées de navigation, accès propriétaire inclus. */
    maxEntrees?: number;
  } = $props();

  const t = $derived(traductionsPubliques(langue));

  /** Chemin courant : sert à `aria-current` et aux liens de langue. */
  const chemin = $derived(page.url.pathname);

  const entrees = $derived(
    [
      { href: retourHref, libelle: retourLibelle ?? t.accueil, retour: true },
      ...liens.map((lien) => ({ ...lien, retour: false })),
      { href: "/aide", libelle: t.aide, retour: false },
      { href: "/legales", libelle: t.mentionsLegales, retour: false },
    ].slice(0, Math.max(1, maxEntrees - (accesProprietaire ? 1 : 0))),
  );

  const langueAffichee = $derived(afficherLangue ?? langue !== undefined);

  const estActif = (href: string) =>
    href === "/"
      ? chemin === "/"
      : chemin === href || chemin.startsWith(`${href}/`);
</script>

<header class="sticky top-0 z-30 border-b border-bordure ui-verre ui-noprint">
  <div
    class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 sm:px-6"
  >
    <a
      class="inline-flex min-h-11 items-center gap-2.5 font-semibold tracking-tight"
      href={retourHref}
    >
      {#if logoUrl}
        <img class="h-8 w-auto" src={logoUrl} alt="" />
      {:else}
        <span
          class="grid size-8 place-items-center rounded-lg bg-accent text-sm font-black text-sur-accent"
        >
          {nom.slice(0, 1)}
        </span>
      {/if}
      <span class="text-sm">{nom}</span>
    </a>

    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <nav
        class="flex flex-wrap items-center gap-1"
        aria-label={t.navigationPrincipale}
      >
        {#each entrees as entree (entree.href + entree.libelle)}
          <a
            class="ui-nav-lien"
            href={entree.href}
            aria-current={estActif(entree.href) ? "page" : undefined}
          >
            {#if entree.retour}<span aria-hidden="true">←</span>{/if}
            {entree.libelle}
          </a>
        {/each}
        {#if actions}
          {@render actions()}
        {/if}
      </nav>

      {#if accesProprietaire}
        <a
          class="ui-nav-lien text-xs font-normal text-encre-faine opacity-90 hover:opacity-100"
          href="/login"
          aria-current={estActif("/login") ? "page" : undefined}
        >
          {t.proprietaires}
        </a>
      {/if}

      {#if langueAffichee}
        <SelecteurLangue
          langue={langue ?? "fr"}
          libelle={t.choisirLangue}
          chemin={chemin}
        />
      {/if}
    </div>
  </div>
</header>
