<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import BlocSite from "@/lib/site/blocs/BlocSite.svelte";
  import { traductionsSite } from "@/lib/i18n-site";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const t = $derived(traductionsSite(data.langue));

  const titre = $derived(
    data.page.seo.title || data.site.seoDefaut.title || data.tenant.nom,
  );
  const description = $derived(
    data.page.seo.description ||
      data.site.seoDefaut.description ||
      "Séjournez chez nous.",
  );
  const jsonLd = $derived(
    JSON.stringify(data.jsonLd).replace(/</g, "\\u003c"),
  );

  const libelles = $derived<Record<string, string>>({
    accueil: t.accueil,
    logement: t.logement,
    region: t.region,
    contact: t.contact,
  });

  function lienPage(slug: string): string {
    return `/site/${data.tenant.slug}${slug === "accueil" ? "" : `/${slug}`}`;
  }
</script>

<svelte:head>
  <title>{titre}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={data.canonical} />
  <meta property="og:title" content={titre} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={data.canonical} />
  {#if data.page.seo.ogImage}
    <meta property="og:image" content={data.page.seo.ogImage} />
  {/if}
  {#each data.site.langues as langue}
    <link rel="alternate" hreflang={langue} href={`${data.canonical}?lang=${langue}`} />
  {/each}
  {@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<div
  class="min-h-screen bg-[var(--site-fond)] text-[var(--site-texte)]"
  style={`--site-accent:${data.template.accent};--site-fond:${data.template.fond};--site-texte:${data.template.texte};--site-surface:${data.template.surface}`}
>
  <header class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5">
    <a class="text-lg font-semibold tracking-tight" href={`/site/${data.tenant.slug}`}>
      {data.tenant.nom}
    </a>
    <nav class="flex flex-wrap gap-4 text-sm">
      {#each data.pages as page (page.id)}
        <a class="underline-offset-4 hover:underline" href={lienPage(page.slug)}>
          {libelles[page.type] ?? page.type}
        </a>
      {/each}
    </nav>
  </header>

  <main>
    {#each data.blocs as bloc (bloc.id)}
      <BlocSite {bloc} />
    {/each}
    {#if data.blocs.length === 0}
      <section class="mx-auto max-w-3xl space-y-4 px-6 py-16">
        <h1 class="text-4xl font-semibold tracking-tight">
          {data.page.seo.title || data.tenant.nom}
        </h1>
        <p class="text-base leading-relaxed opacity-80">
          {data.page.langues[data.langue] ?? ""}
        </p>
      </section>
    {/if}

    {#if data.enquete.active}
      <section
        class="mx-auto max-w-3xl space-y-4 px-6 pb-16"
        id="demande"
      >
        <h2 class="text-2xl font-semibold tracking-tight">{t.demandeTitre}</h2>
        <p class="text-sm leading-relaxed opacity-80">{t.demandeIntro}</p>

        {#if form?.ok}
          <p class="rounded border border-current/20 px-4 py-3 text-sm" role="status">
            {t.demandeOk}
          </p>
        {:else if form?.erreur}
          <p class="rounded border border-current/20 px-4 py-3 text-sm" role="alert">
            {t.demandeErreur}
          </p>
        {/if}

        <form method="POST" action="?/demande" class="grid gap-4 sm:grid-cols-2">
          <label class="flex flex-col gap-1 text-sm">
            <span>{t.demandeNom}</span>
            <input
              class="rounded border border-black/20 bg-white/80 px-3 py-2"
              name="nom"
              required
              minlength="2"
              maxlength="120"
              autocomplete="name"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm">
            <span>{t.demandeEmail}</span>
            <input
              class="rounded border border-black/20 bg-white/80 px-3 py-2"
              name="email"
              type="email"
              required
              autocomplete="email"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm">
            <span>{t.demandeTelephone}</span>
            <input
              class="rounded border border-black/20 bg-white/80 px-3 py-2"
              name="telephone"
              maxlength="40"
              autocomplete="tel"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm">
            <span>{t.demandeVoyageurs}</span>
            <input
              class="rounded border border-black/20 bg-white/80 px-3 py-2"
              name="voyageurs"
              type="number"
              min="1"
              max="20"
              step="1"
              value="2"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm">
            <span>{t.demandeArrivee}</span>
            <input
              class="rounded border border-black/20 bg-white/80 px-3 py-2"
              name="arrivee"
              type="date"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm">
            <span>{t.demandeDepart}</span>
            <input
              class="rounded border border-black/20 bg-white/80 px-3 py-2"
              name="depart"
              type="date"
            />
          </label>
          {#if data.enquete.logements.length > 0}
            <label class="flex flex-col gap-1 text-sm sm:col-span-2">
              <span>{t.demandeLogement}</span>
              <select
                class="rounded border border-black/20 bg-white/80 px-3 py-2"
                name="logementId"
              >
                <option value="">-</option>
                {#each data.enquete.logements as logement (logement.id)}
                  <option value={logement.id}>{logement.nom}</option>
                {/each}
              </select>
            </label>
          {/if}
          <label class="flex flex-col gap-1 text-sm sm:col-span-2">
            <span>{t.demandeMessage}</span>
            <textarea
              class="rounded border border-black/20 bg-white/80 px-3 py-2"
              name="message"
              rows="4"
              maxlength="4000"
            ></textarea>
          </label>
          <input
            type="hidden"
            name="source"
            value={data.enquete.source}
          />
          <button
            class="rounded bg-[var(--site-accent)] px-5 py-3 text-sm font-medium text-white sm:col-span-2"
            type="submit"
          >
            {t.demandeEnvoyer}
          </button>
        </form>
      </section>
    {/if}
  </main>

  <footer class="border-t border-black/10 px-6 py-8 text-center text-xs opacity-70">
    <p>© {new Date().getFullYear()} {data.tenant.nom}</p>
    {#if data.tenant.adresse}<p class="mt-1">{data.tenant.adresse}</p>{/if}
    <a class="mt-2 inline-flex underline" href="/legales">{t.mentionsLegales}</a>
  </footer>
</div>
