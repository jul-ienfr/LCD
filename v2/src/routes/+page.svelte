<script lang="ts">
  /**
   * Vitrine publique (T034 hiérarchie, T035 langue, T043 SEO).
   *
   * Hiérarchie : une promesse (h1), des preuves, un prix d'appel issu des
   * données réelles, puis **un seul parcours principal vers `/reserver`**. Les
   * autres actions restent secondaires ; la page ne dépend d'aucun JavaScript
   * (`+page.ts` : `csr = false`).
   */
  import type { PageData } from "./$types";
  import { page } from "$app/state";
  import { LANGUES } from "@/lib/i18n";
  import { traductionsVitrine } from "@/lib/i18n/public/vitrine";
  import SelecteurLangue from "@/lib/components/ui/selecteur-langue.svelte";
  import BarreActionMobile from "@/lib/components/ui/barre-action-mobile.svelte";
  import { srcsetLogement } from "@/lib/photos-logement";

  let { data }: { data: PageData } = $props();

  const identite = $derived(data.apparence.identite);
  const t = $derived(traductionsVitrine(data.langue));
  const aujourdhui = new Date().toISOString().slice(0, 10);

  /** URL canonique : origine + chemin, sans paramètre de langue. */
  const canonique = $derived(
    new URL(page.url.pathname, page.url.origin).toString(),
  );
  const imageHero = $derived(
    new URL("/photos/hero-villa-1800.webp", page.url.origin).toString(),
  );
  const titre = $derived(t.metaTitre.replace("{nom}", () => identite.nom));

  /** Prix d'appel : plus petite valeur publiée par le serveur, si lisible. */
  function extrairePrixAppel(): string | null {
    const valeurs = data.adresses
      .map((adresse) => adresse.prix)
      .filter((prix): prix is string => typeof prix === "string")
      .map((prix) => ({
        texte: prix,
        nombre: Number(prix.replace(/[^\d.,]/g, "").replace(",", ".")),
      }))
      .filter((entree) => Number.isFinite(entree.nombre))
      .sort((a, b) => a.nombre - b.nombre);
    return valeurs[0]?.texte ?? null;
  }

  const prixAppel = $derived(extrairePrixAppel());

  /** Données structurées : uniquement ce qui est publié, rien d'inventé. */
  const donneesStructurees = $derived(
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      name: identite.nom,
      url: canonique,
      description: t.metaDescription,
      inLanguage: data.langue,
      image: imageHero,
      ...(identite.emailContact ? { email: identite.emailContact } : {}),
      ...(identite.telephoneContact
        ? { telephone: identite.telephoneContact }
        : {}),
      ...(identite.adresseContact ? { address: identite.adresseContact } : {}),
    }).replace(/</g, "\\u003c"),
  );

  /** Lien de navigation courant, pour `aria-current`. */
  const estActif = (href: string) =>
    page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
</script>

<svelte:head>
  <title>{titre}</title>
  <meta name="description" content={t.metaDescription} />
  <link rel="canonical" href={canonique} />
  {#each LANGUES as code (code)}
    <link rel="alternate" hreflang={code} href={`${canonique}?lang=${code}`} />
  {/each}
  <link rel="alternate" hreflang="x-default" href={canonique} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={identite.nom} />
  <meta property="og:title" content={titre} />
  <meta property="og:description" content={t.metaDescription} />
  <meta property="og:url" content={canonique} />
  <meta property="og:locale" content={t.locale.replace("-", "_")} />
  <meta property="og:image" content={imageHero} />
  <meta name="twitter:card" content="summary_large_image" />
  <link
    rel="preload"
    as="image"
    href="/photos/hero-villa-1800.webp"
    imagesrcset="/photos/hero-villa-900.webp 900w, /photos/hero-villa-1800.webp 1800w"
    imagesizes="100vw"
  />
  {@html `<script type="application/ld+json">${donneesStructurees}</script>`}
</svelte:head>

<div class="bg-fond">
  <header class="absolute inset-x-0 top-0 z-40">
    <div
      class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 md:px-8 md:py-5"
    >
      <a
        class="flex min-h-11 items-center gap-2.5 rounded-full bg-surface/95 py-2 pl-2 pr-4 text-sm font-bold tracking-tight shadow-lg ui-verre"
        href="/"
        aria-current={page.url.pathname === "/" ? "page" : undefined}
      >
        {#if identite.logoUrl}
          <img class="h-8 w-auto" src={identite.logoUrl} alt="" />
        {:else}
          <span
            class="grid size-8 place-items-center rounded-full bg-accent text-sm font-black text-sur-accent"
          >
            {identite.nom.slice(0, 1)}
          </span>
        {/if}
        <span class="hidden sm:block">{identite.nom}</span>
      </a>

      <nav
        class="hidden items-center gap-1 rounded-full bg-surface/90 px-2 py-1.5 text-sm font-semibold shadow-lg ui-verre md:flex"
        aria-label={t.navPrincipale}
      >
        <a
          class="inline-flex min-h-11 items-center rounded-full px-4 hover:bg-surface-2"
          href="/reserver"
          aria-current={estActif("/reserver") ? "page" : undefined}>{t.navSejours}</a
        >
        <a
          class="inline-flex min-h-11 items-center rounded-full px-4 hover:bg-surface-2"
          href="/aide"
          aria-current={estActif("/aide") ? "page" : undefined}>{t.navAide}</a
        >
        <a
          class="inline-flex min-h-11 items-center rounded-full px-4 hover:bg-surface-2"
          href="/login"
          aria-current={estActif("/login") ? "page" : undefined}
          >{t.navProprietaires}</a
        >
      </nav>

      <div class="flex items-center gap-2">
        <SelecteurLangue
          langue={data.langue}
          libelle={t.choisirLangue}
          chemin="/"
          classes="hidden items-center gap-1 rounded-full bg-surface/90 px-2 py-1.5 shadow-lg ui-verre md:flex"
        />
        <a
          class="flex min-h-11 items-center rounded-full bg-surface px-5 text-sm font-semibold shadow-lg ui-verre hover:bg-surface-2"
          href="/reserver"
        >
          {t.ctaReserver}
        </a>
        <details class="relative md:hidden">
          <summary
            class="grid size-11 cursor-pointer list-none place-items-center rounded-full bg-surface text-sm font-bold shadow-lg ui-verre [&::-webkit-details-marker]:hidden"
            aria-label={t.ouvrirMenu}
          >
            ☰
          </summary>
          <div
            class="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-64 rounded-2xl border border-bordure bg-surface p-2 shadow-elevee"
          >
            <a
              class="ui-menu-lien"
              href="/reserver"
              aria-current={estActif("/reserver") ? "page" : undefined}
              >{t.navSejours}</a
            >
            <a
              class="ui-menu-lien"
              href="/aide"
              aria-current={estActif("/aide") ? "page" : undefined}>{t.navAide}</a
            >
            <a
              class="ui-menu-lien"
              href="/login"
              aria-current={estActif("/login") ? "page" : undefined}
              >{t.navProprietaires}</a
            >
            <a class="ui-menu-lien" href="/login">{t.navSeConnecter}</a>
            <SelecteurLangue
              langue={data.langue}
              libelle={t.choisirLangue}
              chemin="/"
              classes="mt-2 flex flex-wrap gap-1 border-t border-bordure pt-2"
            />
          </div>
        </details>
      </div>
    </div>
  </header>

  <main id="contenu">
    <section
      class="relative flex min-h-[94vh] flex-col justify-end overflow-hidden"
      aria-labelledby="tit-promesse"
    >
      <picture>
        <source media="(max-width: 767px)" srcset="/photos/hero-villa-900.webp" />
        <img
          class="absolute inset-0 h-full w-full object-cover"
          src="/photos/hero-villa-1800.webp"
          alt={t.heroImageAlt}
          width="1800"
          height="1100"
          loading="eager"
          fetchpriority="high"
          decoding="async"
        />
      </picture>
      <div
        class="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/75"
        aria-hidden="true"
      ></div>

      <div
        class="relative mx-auto w-full max-w-7xl px-5 pb-10 pt-36 md:px-8 md:pb-16"
      >
        <p
          class="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/80"
        >
          {t.heroSurtitre}
        </p>
        <h1
          id="tit-promesse"
          class="max-w-4xl text-4xl font-semibold leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl"
        >
          {t.heroTitre}
        </h1>
        <p class="mt-5 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
          {t.heroTexte}
        </p>

        <ul
          class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-white/80"
          role="list"
        >
          {#each t.etiquettes.slice(0, 4) as etiquette, index (etiquette)}
            {#if index > 0}<li aria-hidden="true">·</li>{/if}
            <li>{etiquette}</li>
          {/each}
        </ul>

        {#if prixAppel}
          <p class="mt-4 text-sm text-white/90" data-prix-appel>
            {t.heroPrixPrefix}
            <span class="text-base font-bold">{prixAppel}</span>
            · {t.adressesNuit}
          </p>
        {/if}

        <form
          class="mt-8 grid gap-2 rounded-[1.75rem] border border-white/25 bg-surface/95 p-2 shadow-2xl ui-verre md:grid-cols-[1.05fr_1fr_1fr_auto]"
          method="GET"
          action="/reserver"
        >
          <input type="hidden" name="tenant" value="lcd" />
          <div class="rounded-2xl px-5 py-3 md:py-2.5">
            <p
              class="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-encre-faine"
            >
              {t.rechercheDestination}
            </p>
            <p class="mt-1 text-sm font-semibold">
              {t.rechercheDestinationValeur}
            </p>
          </div>
          <label class="min-w-0 rounded-2xl px-5 py-3 hover:bg-surface-2 md:py-2.5">
            <span
              class="block text-[0.625rem] font-bold uppercase tracking-[0.16em] text-encre-faine"
            >
              {t.rechercheArrivee}
            </span>
            <input
              class="mt-1 min-h-11 w-full min-w-0 border-0 bg-transparent p-0 text-sm font-semibold text-encre outline-none"
              type="date"
              name="debut"
              min={aujourdhui}
              required
            />
          </label>
          <label class="min-w-0 rounded-2xl px-5 py-3 hover:bg-surface-2 md:py-2.5">
            <span
              class="block text-[0.625rem] font-bold uppercase tracking-[0.16em] text-encre-faine"
            >
              {t.rechercheDepart}
            </span>
            <input
              class="mt-1 min-h-11 w-full min-w-0 border-0 bg-transparent p-0 text-sm font-semibold text-encre outline-none"
              type="date"
              name="fin"
              min={aujourdhui}
              required
            />
          </label>
          <button
            class="ui-bouton ui-bouton--primaire min-h-14 rounded-2xl px-7 md:min-h-full"
            type="submit"
          >
            {t.rechercheRechercher}
          </button>
        </form>
      </div>
    </section>

    <section
      class="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-[1.15fr_0.85fr] md:gap-16 md:px-8 md:py-28"
      aria-labelledby="tit-preuve"
    >
      <h2
        id="tit-preuve"
        class="max-w-2xl text-3xl font-semibold leading-[1.02] tracking-tight sm:text-4xl md:text-5xl"
      >
        {t.preuveTitre}
      </h2>
      <div class="space-y-6">
        <p class="text-base leading-relaxed text-encre-douce md:text-lg">
          {t.preuveTexte}
        </p>
        <dl class="grid grid-cols-3 gap-4 border-t border-bordure pt-6">
          {#each t.preuves as preuve (preuve.libelle)}
            <div>
              <dt class="text-xl font-bold tabular-nums md:text-2xl">
                {preuve.valeur}
              </dt>
              <dd class="mt-0.5 text-xs text-encre-faine">{preuve.libelle}</dd>
            </div>
          {/each}
        </dl>
      </div>
    </section>

    <section class="border-y border-bordure bg-surface/60">
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div
        class="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-4 md:px-8"
        role="region"
        tabindex="0"
        aria-label={t.etiquettesTitre}
      >
        {#each t.etiquettes as etiquette (etiquette)}
          <span
            class="whitespace-nowrap rounded-full border border-bordure bg-surface px-4 py-2 text-xs font-semibold text-encre-douce"
          >
            {etiquette}
          </span>
        {/each}
      </div>
    </section>

    <section
      class="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28"
      aria-labelledby="tit-maisons"
    >
      <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="ui-surtitre">{t.maisonsSurtitre}</p>
          <h2
            id="tit-maisons"
            class="mt-3 text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {t.maisonsTitre}
          </h2>
        </div>
        <p class="max-w-sm text-sm leading-relaxed text-encre-douce">
          {t.maisonsTexte}
        </p>
      </div>

      <div class="grid auto-rows-[14rem] gap-3 md:auto-rows-[15rem] md:grid-cols-4">
        <figure
          class="ui-photo group relative col-span-1 row-span-2 overflow-hidden rounded-3xl md:col-span-2"
        >
          <img
            class="h-full w-full object-cover"
            src="/photos/salon.webp"
            srcset={srcsetLogement("/photos/salon.webp")}
            sizes="(min-width: 768px) 46vw, 92vw"
            alt={t.maisonsPhotos[0].alt}
            width="1000"
            height="750"
            loading="lazy"
            decoding="async"
          />
          <figcaption
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white"
          >
            <span class="text-xs uppercase tracking-widest text-white/70"
              >{t.maisonsPhotos[0].surtitre}</span
            >
            <p class="mt-1 text-lg font-semibold">{t.maisonsPhotos[0].titre}</p>
          </figcaption>
        </figure>
        <figure
          class="ui-photo group relative col-span-1 row-span-1 overflow-hidden rounded-3xl md:col-span-2"
        >
          <img
            class="h-full w-full object-cover"
            src="/photos/piscine.webp"
            srcset={srcsetLogement("/photos/piscine.webp")}
            sizes="(min-width: 768px) 46vw, 92vw"
            alt={t.maisonsPhotos[1].alt}
            width="1000"
            height="750"
            loading="lazy"
            decoding="async"
          />
          <figcaption
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white"
          >
            <span class="text-xs uppercase tracking-widest text-white/70"
              >{t.maisonsPhotos[1].surtitre}</span
            >
            <p class="mt-1 text-lg font-semibold">{t.maisonsPhotos[1].titre}</p>
          </figcaption>
        </figure>
        <figure class="ui-photo group relative overflow-hidden rounded-3xl">
          <img
            class="h-full w-full object-cover"
            src="/photos/chambre.webp"
            srcset={srcsetLogement("/photos/chambre.webp")}
            sizes="(min-width: 768px) 23vw, 92vw"
            alt={t.maisonsPhotos[2].alt}
            width="1000"
            height="750"
            loading="lazy"
            decoding="async"
          />
          <figcaption class="sr-only">{t.maisonsPhotos[2].alt}</figcaption>
        </figure>
        <figure class="ui-photo group relative overflow-hidden rounded-3xl">
          <img
            class="h-full w-full object-cover"
            src="/photos/terrasse.webp"
            srcset={srcsetLogement("/photos/terrasse.webp")}
            sizes="(min-width: 768px) 23vw, 92vw"
            alt={t.maisonsPhotos[3].alt}
            width="1000"
            height="750"
            loading="lazy"
            decoding="async"
          />
          <figcaption class="sr-only">{t.maisonsPhotos[3].alt}</figcaption>
        </figure>
      </div>
    </section>

    <section
      class="mx-auto max-w-7xl px-5 pb-20 md:px-8 md:pb-28"
      aria-labelledby="tit-adresses"
    >
      <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="ui-surtitre">{t.adressesSurtitre}</p>
          <h2
            id="tit-adresses"
            class="mt-3 text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {t.adressesTitre}
          </h2>
        </div>
        <a class="ui-bouton ui-bouton--secondaire" href="/reserver">
          {t.adressesTout}
        </a>
      </div>

      {#if data.adresses.length === 0}
        <div class="rounded-3xl border border-bordure bg-surface p-8 text-center">
          <p class="text-encre-douce">
            {t.adressesVide}
            <a class="ui-lien-action" href="/aide">{t.adressesVideCta}</a>
            {t.adressesVideSuite}
          </p>
        </div>
      {:else}
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {#each data.adresses as adresse (adresse.id)}
            <article class="group">
              <a
                class="block rounded-3xl focus-visible:outline-offset-4"
                href={`/reserver?tenant=lcd&logement=${encodeURIComponent(adresse.id)}`}
              >
                <div
                  class="ui-photo relative aspect-[4/3] overflow-hidden rounded-3xl bg-surface-2"
                >
                  <img
                    class="h-full w-full object-cover"
                    src={adresse.photo}
                    alt={`${adresse.nom}${adresse.adresse ? ` ${t.adressesLieu} ${adresse.adresse}` : ""}`}
                    width="1000"
                    height="750"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div class="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-base font-semibold tracking-tight">
                      {adresse.nom}
                    </h3>
                    <p class="mt-0.5 text-sm text-encre-faine">
                      {adresse.adresse ?? t.rechercheDestinationValeur}
                    </p>
                  </div>
                  {#if adresse.prix}
                    <p class="shrink-0 text-right text-sm">
                      <span class="font-semibold">{adresse.prix}</span>
                      <span class="block text-xs text-encre-faine"
                        >{t.adressesNuit}</span
                      >
                    </p>
                  {/if}
                </div>
                <p
                  class="mt-2 text-sm font-semibold text-accent md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                >
                  {t.adressesVoir}
                </p>
              </a>
            </article>
          {/each}
        </div>
      {/if}
    </section>

    <section class="bg-encre text-fond" aria-labelledby="tit-sejour">
      <div class="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div class="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.2em] opacity-60">
              {t.sejourSurtitre}
            </p>
            <h2
              id="tit-sejour"
              class="mt-4 text-3xl font-semibold leading-tight tracking-tight md:text-5xl"
            >
              {t.sejourTitre}
            </h2>
            <p class="mt-5 max-w-sm text-sm leading-relaxed opacity-70">
              {t.sejourTexte}
            </p>
          </div>
          <ol class="grid gap-0" role="list">
            {#each t.engagements as engagement (engagement.numero)}
              <li
                class="grid gap-4 border-t border-white/15 py-6 sm:grid-cols-[3rem_1fr]"
              >
                <span class="text-xs font-bold tabular-nums opacity-50"
                  >{engagement.numero}</span
                >
                <div>
                  <h3 class="text-lg font-semibold">{engagement.titre}</h3>
                  <p class="mt-1.5 max-w-lg text-sm leading-relaxed opacity-70">
                    {engagement.texte}
                  </p>
                </div>
              </li>
            {/each}
          </ol>
        </div>
      </div>
    </section>

    <section
      class="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28"
      aria-labelledby="tit-proprietaires"
    >
      <div
        class="grid overflow-hidden rounded-[2rem] border border-bordure bg-surface shadow-sm md:grid-cols-2"
      >
        <div class="relative min-h-[20rem]">
          <img
            class="absolute inset-0 h-full w-full object-cover"
            src="/photos/maison.webp"
            srcset={srcsetLogement("/photos/maison.webp")}
            sizes="(min-width: 768px) 46vw, 92vw"
            alt={t.proprietairesImageAlt}
            width="1000"
            height="750"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div class="flex flex-col justify-center gap-5 p-8 md:p-12">
          <p class="ui-surtitre">{t.proprietairesSurtitre}</p>
          <h2
            id="tit-proprietaires"
            class="text-3xl font-semibold leading-tight tracking-tight md:text-4xl"
          >
            {t.proprietairesTitre}
          </h2>
          <p class="text-sm leading-relaxed text-encre-douce">
            {t.proprietairesTexte}
          </p>
          <div class="flex flex-wrap gap-3">
            <a class="ui-bouton ui-bouton--encre" href="/login"
              >{t.proprietairesCta}</a
            >
            <a class="ui-bouton ui-bouton--secondaire" href="/aide"
              >{t.proprietairesCtaSecondaire}</a
            >
          </div>
        </div>
      </div>
    </section>

    <section
      class="mx-auto max-w-7xl px-5 pb-20 md:px-8 md:pb-28"
      aria-labelledby="tit-formules"
    >
      <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="ui-surtitre">{t.formulesSurtitre}</p>
          <h2
            id="tit-formules"
            class="mt-3 text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {t.formulesTitre}
          </h2>
        </div>
        <p class="max-w-sm text-sm text-encre-douce">{t.formulesNote}</p>
      </div>
      <div class="grid gap-4 md:grid-cols-3">
        {#each t.formules as formule (formule.nom)}
          <article
            class="flex flex-col gap-4 rounded-3xl border bg-surface p-7 {formule.enAvant
              ? 'border-accent shadow-elevee'
              : 'border-bordure'}"
          >
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-lg font-semibold">{formule.nom}</h3>
              {#if formule.enAvant}
                <span class="ui-badge ui-badge--accent"
                  >{t.formulePopulaire}</span
                >
              {/if}
            </div>
            <div>
              <p class="text-4xl font-extrabold tabular-nums">
                {formule.prix} €
              </p>
              <p class="text-xs text-encre-faine">{formule.base}</p>
            </div>
            <p class="text-sm text-encre-douce">{formule.cible}</p>
            <ul class="flex flex-col gap-2 text-sm" role="list">
              {#each formule.points as point (point)}
                <li class="flex items-start gap-2">
                  <span aria-hidden="true" class="mt-0.5 text-accent">✓</span>
                  {point}
                </li>
              {/each}
            </ul>
            <a class="ui-bouton ui-bouton--secondaire mt-auto" href="/login"
              >{t.formuleCta}</a
            >
          </article>
        {/each}
      </div>
    </section>

    <section
      class="relative overflow-hidden bg-accent text-sur-accent"
      aria-labelledby="tit-final"
    >
      <div
        class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 py-16 md:px-8 md:py-20"
      >
        <div class="max-w-2xl">
          <p class="text-xs font-bold uppercase tracking-[0.2em]">
            {t.finalSurtitre}
          </p>
          <h2
            id="tit-final"
            class="mt-3 text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {t.finalTitre}
          </h2>
        </div>
        <div class="flex flex-wrap gap-3">
          <a class="ui-bouton ui-bouton--encre" href="/reserver"
            >{t.finalCta}</a
          >
          <a class="ui-bouton ui-bouton--secondaire" href="/aide"
            >{t.finalCtaSecondaire}</a
          >
        </div>
      </div>
    </section>
  </main>

  <footer class="border-t border-bordure bg-surface">
    <div
      class="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8"
    >
      <div class="space-y-3">
        <a
          class="flex min-h-11 items-center gap-2.5 text-base font-bold tracking-tight"
          href="/"
        >
          {#if identite.logoUrl}
            <img class="h-8 w-auto" src={identite.logoUrl} alt="" />
          {:else}
            <span
              class="grid size-8 place-items-center rounded-lg bg-accent text-sm font-black text-sur-accent"
            >
              {identite.nom.slice(0, 1)}
            </span>
          {/if}
          {identite.nom}
        </a>
        <p class="max-w-xs text-sm leading-relaxed text-encre-douce">
          {t.piedSlogan}
        </p>
      </div>
      <div>
        <p
          class="text-xs font-bold uppercase tracking-widest text-encre-faine"
        >
          {t.piedSejours}
        </p>
        <ul class="mt-3 space-y-2 text-sm" role="list">
          <li>
            <a class="ui-lien-action inline-flex min-h-11 items-center" href="/reserver">{t.piedReserver}</a>
          </li>
          <li><a class="ui-lien-action inline-flex min-h-11 items-center" href="/aide">{t.piedAide}</a></li>
          <li>
            <a class="ui-lien-action inline-flex min-h-11 items-center" href="/design">{t.piedDesign}</a>
          </li>
        </ul>
      </div>
      <div>
        <p
          class="text-xs font-bold uppercase tracking-widest text-encre-faine"
        >
          {t.piedProprietaires}
        </p>
        <ul class="mt-3 space-y-2 text-sm" role="list">
          <li>
            <a class="ui-lien-action inline-flex min-h-11 items-center" href="/login">{t.piedEspaceHote}</a>
          </li>
          <li>
            <a class="ui-lien-action inline-flex min-h-11 items-center" href="/login">{t.piedConfier}</a>
          </li>
          <li>
            <a class="ui-lien-action inline-flex min-h-11 items-center" href="/hote">{t.piedTableauBord}</a>
          </li>
        </ul>
      </div>
      <div>
        <p
          class="text-xs font-bold uppercase tracking-widest text-encre-faine"
        >
          {t.piedInformations}
        </p>
        <ul class="mt-3 space-y-2 text-sm" role="list">
          <li>
            <a class="ui-lien-action inline-flex min-h-11 items-center" href="/legales">{t.piedMentions}</a>
          </li>
          <li>
            <a
              class="ui-lien-action inline-flex min-h-11 items-center"
              href="/retour?parcours=P-RESA">{t.piedAvis}</a
            >
          </li>
          <li>
            <a class="ui-lien-action inline-flex min-h-11 items-center" href="/api/lite?on=1&retour=/"
              >{t.piedVersionLegere}</a
            >
          </li>
          {#if identite.emailContact}
            <li>
              <a class="ui-lien-action inline-flex min-h-11 items-center" href={`mailto:${identite.emailContact}`}
                >{identite.emailContact}</a
              >
            </li>
          {/if}
        </ul>
      </div>
    </div>
    <div class="border-t border-bordure">
      <div
        class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs text-encre-faine md:px-8"
      >
        <p>© {new Date().getFullYear()} {identite.nom}. {t.piedDroits}</p>
        <p>{t.piedSansJs}</p>
      </div>
    </div>
  </footer>

  <BarreActionMobile langue={data.langue}>
    {#snippet actions()}
      <div class="min-w-0 flex-1">
        <a class="ui-bouton ui-bouton--primaire w-full" href="/reserver"
          >{t.ctaReserver}</a
        >
      </div>
      <div class="min-w-0 flex-1">
        <a class="ui-bouton ui-bouton--secondaire w-full" href="/aide"
          >{t.navAide}</a
        >
      </div>
    {/snippet}
  </BarreActionMobile>
</div>
