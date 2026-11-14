<script lang="ts">
  /**
   * Centre d'aide public (T042 traduction, T043 SEO).
   *
   * Cinq langues, aucun JavaScript (`+page.ts` : `csr = false`), structure
   * stable : les tableaux des rôles et des espaces gardent le même ordre dans
   * toutes les langues, seuls les libellés changent.
   */
  import type { PageData } from "./$types";
  import { page } from "$app/state";
  import { LANGUES } from "@/lib/i18n";
  import { traductionsAide } from "@/lib/i18n/public/aide";
  import EntetePublique from "@/lib/components/entete-publique.svelte";
  import FilAriane from "@/lib/components/ui/fil-ariane.svelte";

  let { data }: { data: PageData } = $props();

  const identite = $derived(data.apparence.identite);
  const t = $derived(traductionsAide(data.langue));

  const canonique = $derived(
    new URL(page.url.pathname, page.url.origin).toString(),
  );
  const accueil = $derived(new URL("/", page.url.origin).toString());
  const titre = $derived(t.metaTitre.replace("{nom}", () => identite.nom));

  /** Données structurées : page d'aide + fil d'Ariane, rien d'inventé. */
  const donneesStructurees = $derived(
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: titre,
      description: t.metaDescription,
      url: canonique,
      inLanguage: data.langue,
      isPartOf: {
        "@type": "WebSite",
        name: identite.nom,
        url: accueil,
      },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: t.accueil,
            item: accueil,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: t.aide,
            item: canonique,
          },
        ],
      },
    }).replace(/</g, "\\u003c"),
  );
</script>

<svelte:head>
  <title>{titre}</title>
  <meta name="description" content={t.metaDescription} />
  <link rel="canonical" href={canonique} />
  {#each LANGUES as code (code)}
    <link rel="alternate" hreflang={code} href={`${canonique}?lang=${code}`} />
  {/each}
  <link rel="alternate" hreflang="x-default" href={canonique} />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content={identite.nom} />
  <meta property="og:title" content={titre} />
  <meta property="og:description" content={t.metaDescription} />
  <meta property="og:url" content={canonique} />
  <meta property="og:locale" content={t.locale.replace("-", "_")} />
  {@html `<script type="application/ld+json">${donneesStructurees}</script>`}
</svelte:head>

<EntetePublique
  nom={identite.nom}
  logoUrl={identite.logoUrl}
  langue={data.langue}
  liens={[{ href: "/reserver", libelle: t.piedReserver }]}
/>

<main
  id="contenu"
  class="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12"
>
  <FilAriane
    libelle={t.filAriane}
    elements={[
      { libelle: t.accueil, href: "/" },
      { libelle: t.aide },
    ]}
  />

  <header class="space-y-3">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {t.surtitre}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.titre}</h1>
    <p class="max-w-2xl text-encre-douce">{t.intro}</p>
  </header>

  <section class="space-y-3" aria-labelledby="tit-roles">
    <h2 id="tit-roles" class="text-xl font-semibold">{t.rolesTitre}</h2>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div 
      class="overflow-x-auto rounded-carte border border-bordure bg-surface"
      role="region"
      tabindex="0"
      aria-labelledby="tit-roles"
    >
      <table class="ui-tableau">
        <thead>
          <tr>
            {#each t.rolesEntetes as entete (entete)}
              <th>{entete}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each t.roles as ligne (ligne.role)}
            <tr>
              <td class="font-medium">{ligne.role}</td>
              <td class="text-encre-douce">{ligne.acces}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="text-sm text-encre-douce">{t.rolesNote}</p>
  </section>

  <section class="space-y-3" aria-labelledby="tit-espaces">
    <h2 id="tit-espaces" class="text-xl font-semibold">{t.espacesTitre}</h2>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div 
      class="overflow-x-auto rounded-carte border border-bordure bg-surface"
      role="region"
      tabindex="0"
      aria-labelledby="tit-espaces"
    >
      <table class="ui-tableau">
        <thead>
          <tr>
            {#each t.espacesEntetes as entete (entete)}
              <th>{entete}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each t.espaces as ligne (ligne.chemin)}
            <tr>
              <td class="font-mono text-xs">{ligne.chemin}</td>
              <td class="text-encre-douce">{ligne.roles}</td>
              <td class="text-encre-douce">{ligne.contenu}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="ui-carte space-y-3" aria-labelledby="tit-hors-ligne">
    <h2 id="tit-hors-ligne" class="text-xl font-semibold">
      {t.horsLigneTitre}
    </h2>
    <p class="text-sm text-encre-douce">{t.horsLigneTexte1}</p>
    <p class="text-sm text-encre-douce">{t.horsLigneTexte2}</p>
  </section>

  <section class="ui-carte space-y-3" aria-labelledby="tit-limites">
    <h2 id="tit-limites" class="text-xl font-semibold">{t.limitesTitre}</h2>
    <ul class="list-disc space-y-1 pl-5 text-sm text-encre-douce">
      {#each t.limites as limite (limite)}
        <li>{limite}</li>
      {/each}
    </ul>
  </section>

  <footer
    class="flex flex-wrap items-center justify-between gap-3 border-t border-bordure pt-4 text-sm text-encre-faine"
  >
    <div class="flex flex-wrap gap-4">
      <a class="ui-lien-action inline-flex min-h-11 items-center" href="/legales"
        >{t.piedMentions}</a
      >
      <a class="ui-lien-action inline-flex min-h-11 items-center" href="/reserver"
        >{t.piedReserver}</a
      >
      <a
        class="ui-lien-action inline-flex min-h-11 items-center"
        href="/retour?parcours=P-RESA"
        >{t.piedAvis}</a
      >
    </div>
    <a class="ui-lien-action inline-flex min-h-11 items-center" href="/"
      >{t.retourAccueil}</a
    >
  </footer>
</main>
